from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
from scipy import stats
from datetime import datetime, timedelta
import uvicorn

# ============================================
# FASTAPI APP INITIALIZATION
# ============================================

app = FastAPI(
    title="Ministry of Finance - AI Analysis Service",
    description="Advisory AI service for trend analysis, forecasting, and anomaly detection",
    version="1.0.0"
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Add production domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# DATA MODELS
# ============================================

class TrendAnalysisRequest(BaseModel):
    metric_name: str
    data: List[float] = Field(..., min_items=2, description="Time series data points")
    timestamps: Optional[List[str]] = None

class TrendAnalysisResponse(BaseModel):
    metric_name: str
    trend_direction: str
    slope: float
    confidence: float
    data_points_analyzed: int
    explanation: str
    period_start: Optional[str] = None
    period_end: Optional[str] = None

class ForecastRequest(BaseModel):
    metric_name: str
    data: List[float] = Field(..., min_items=5, description="Historical time series data")
    forecast_periods: int = Field(default=30, ge=1, le=365, description="Number of periods to forecast")

class ForecastResponse(BaseModel):
    metric_name: str
    forecasts: List[dict]
    model_used: str
    confidence: float
    explanation: str

class AnomalyDetectionRequest(BaseModel):
    metric_name: str
    data: List[float] = Field(..., min_items=10, description="Time series data for anomaly detection")
    timestamps: Optional[List[str]] = None
    threshold: float = Field(default=3.0, ge=1.0, le=5.0, description="Z-score threshold")

class AnomalyDetectionResponse(BaseModel):
    metric_name: str
    anomalies: List[dict]
    total_anomalies: int
    explanation: str

# ============================================
# HELPER FUNCTIONS
# ============================================

def calculate_confidence(r_squared: float, n: int) -> float:
    """
    Calculate confidence score based on R-squared and sample size.
    Returns a percentage between 0 and 100.
    """
    # Adjust confidence based on sample size
    size_factor = min(1.0, n / 30)  # Full confidence at 30+ data points
    confidence = r_squared * size_factor * 100
    return round(min(confidence, 99.9), 2)

def simple_moving_average_forecast(data: List[float], periods: int, window: int = 5) -> List[float]:
    """
    Simple moving average forecasting.
    """
    forecasts = []
    current_data = list(data)
    
    for _ in range(periods):
        if len(current_data) >= window:
            forecast = np.mean(current_data[-window:])
        else:
            forecast = np.mean(current_data)
        forecasts.append(forecast)
        current_data.append(forecast)
    
    return forecasts

# ============================================
# ENDPOINTS
# ============================================

@app.get("/")
def root():
    return {
        "service": "Ministry of Finance - AI Analysis Service",
        "status": "operational",
        "version": "1.0.0",
        "endpoints": ["/analyze/trends", "/analyze/forecast", "/analyze/anomalies", "/health"]
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "ai-analysis"
    }

@app.post("/analyze/trends", response_model=TrendAnalysisResponse)
def analyze_trends(request: TrendAnalysisRequest):
    """
    Analyze time series data for trends using linear regression.
    
    Returns:
    - Trend direction (upward, downward, stable)
    - Slope of the trend line
    - Confidence score (0-100)
    - Explanation in plain language
    """
    try:
        data = np.array(request.data)
        n = len(data)
        x = np.arange(n)
        
        # Linear regression
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, data)
        r_squared = r_value ** 2
        
        # Determine trend direction
        if abs(slope) < (np.std(data) * 0.01):  # Less than 1% of std dev
            trend_direction = "stable"
        elif slope > 0:
            trend_direction = "upward"
        else:
            trend_direction = "downward"
        
        # Calculate confidence
        confidence = calculate_confidence(r_squared, n)
        
        # Generate explanation
        if trend_direction == "stable":
            explanation = f"The {request.metric_name} shows a stable trend with minimal variation over the analyzed period. The data points remain relatively consistent with {confidence}% confidence."
        elif trend_direction == "upward":
            explanation = f"The {request.metric_name} demonstrates an upward trend with a slope of {slope:.4f}. This indicates consistent growth over the analyzed period with {confidence}% confidence."
        else:
            explanation = f"The {request.metric_name} shows a downward trend with a slope of {slope:.4f}. This indicates a declining pattern over the analyzed period with {confidence}% confidence."
        
        # Determine period
        period_start = request.timestamps[0] if request.timestamps else None
        period_end = request.timestamps[-1] if request.timestamps else None
        
        return TrendAnalysisResponse(
            metric_name=request.metric_name,
            trend_direction=trend_direction,
            slope=round(slope, 4),
            confidence=confidence,
            data_points_analyzed=n,
            explanation=explanation,
            period_start=period_start,
            period_end=period_end
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trend analysis failed: {str(e)}")

@app.post("/analyze/forecast", response_model=ForecastResponse)
def analyze_forecast(request: ForecastRequest):
    """
    Generate forecasts using simple moving average and linear extrapolation.
    
    Returns:
    - Forecasted values with confidence intervals
    - Model used
    - Confidence score
    - Explanation
    """
    try:
        data = np.array(request.data)
        n = len(data)
        
        # Use linear regression for trend
        x = np.arange(n)
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, data)
        r_squared = r_value ** 2
        
        # Calculate standard deviation for confidence intervals
        residuals = data - (slope * x + intercept)
        std_residuals = np.std(residuals)
        
        # Generate forecasts
        forecasts = []
        for i in range(1, request.forecast_periods + 1):
            future_x = n + i - 1
            predicted_value = slope * future_x + intercept
            
            # Confidence interval (95% = ~2 std deviations)
            margin = 2 * std_residuals * (1 + i * 0.05)  # Increasing uncertainty over time
            
            forecasts.append({
                "period": i,
                "predicted_value": round(float(predicted_value), 2),
                "lower_bound": round(float(predicted_value - margin), 2),
                "upper_bound": round(float(predicted_value + margin), 2),
                "confidence": round(max(50, calculate_confidence(r_squared, n) - i * 0.5), 2)
            })
        
        confidence = calculate_confidence(r_squared, n)
        
        explanation = f"Forecast generated using linear regression based on {n} historical data points. "
        explanation += f"The model shows {confidence}% confidence in near-term predictions. "
        explanation += f"Confidence intervals widen for longer-term forecasts due to increasing uncertainty."
        
        return ForecastResponse(
            metric_name=request.metric_name,
            forecasts=forecasts,
            model_used="Linear Regression with Confidence Intervals",
            confidence=confidence,
            explanation=explanation
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting failed: {str(e)}")

@app.post("/analyze/anomalies", response_model=AnomalyDetectionResponse)
def analyze_anomalies(request: AnomalyDetectionRequest):
    """
    Detect anomalies using Z-score method.
    
    Returns:
    - List of detected anomalies with indices and values
    - Severity classification
    - Explanation
    """
    try:
        data = np.array(request.data)
        n = len(data)
        
        # Calculate Z-scores
        mean = np.mean(data)
        std = np.std(data)
        
        if std == 0:
            return AnomalyDetectionResponse(
                metric_name=request.metric_name,
                anomalies=[],
                total_anomalies=0,
                explanation=f"No anomalies detected. The {request.metric_name} data shows zero variance (all values are identical)."
            )
        
        z_scores = np.abs((data - mean) / std)
        
        # Detect anomalies
        anomalies = []
        for i, (value, z_score) in enumerate(zip(data, z_scores)):
            if z_score >= request.threshold:
                # Determine severity
                if z_score >= 4.0:
                    severity = "critical"
                elif z_score >= 3.5:
                    severity = "high"
                elif z_score >= 3.0:
                    severity = "medium"
                else:
                    severity = "low"
                
                anomalies.append({
                    "index": i,
                    "value": round(float(value), 2),
                    "expected_value": round(float(mean), 2),
                    "deviation": round(float((value - mean) / mean * 100), 2),
                    "z_score": round(float(z_score), 2),
                    "severity": severity,
                    "timestamp": request.timestamps[i] if request.timestamps and i < len(request.timestamps) else None
                })
        
        # Generate explanation
        if len(anomalies) == 0:
            explanation = f"No significant anomalies detected in {request.metric_name}. All data points fall within {request.threshold} standard deviations of the mean."
        else:
            explanation = f"Detected {len(anomalies)} anomal{'y' if len(anomalies) == 1 else 'ies'} in {request.metric_name} "
            explanation += f"using a Z-score threshold of {request.threshold}. "
            explanation += f"These data points deviate significantly from the expected pattern and require investigation."
        
        return AnomalyDetectionResponse(
            metric_name=request.metric_name,
            anomalies=anomalies,
            total_anomalies=len(anomalies),
            explanation=explanation
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")

# ============================================
# MAIN
# ============================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
