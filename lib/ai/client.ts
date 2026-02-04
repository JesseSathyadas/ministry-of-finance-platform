// AI Service Client
// STRICTLY ADVISORY ONLY
// No automated decision making.
// All results must be reviewed by a human.

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'

export interface TrendAnalysisResponse {
    metric_name: string
    trend_direction: 'upward' | 'downward' | 'stable'
    slope: number
    confidence: number
    explanation: string
    data_points_analyzed: number
}

export interface RequestError {
    message: string
    status?: number
}

const MAX_RETRIES = 3
const INITIAL_BACKOFF = 1000 // 1 second

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES, backoff = INITIAL_BACKOFF): Promise<Response> {
    try {
        const response = await fetch(url, options)
        if (!response.ok && response.status >= 500) {
            // Retry on server errors
            throw new Error(`Server error: ${response.status}`)
        }
        return response
    } catch (error) {
        if (retries > 0) {
            console.warn(`Request failed, retrying in ${backoff}ms... (${retries} attempts left)`)
            await new Promise(resolve => setTimeout(resolve, backoff))
            return fetchWithRetry(url, options, retries - 1, backoff * 2)
        }
        throw error
    }
}

export async function analyzeTrends(
    metricName: string,
    data: number[],
    timestamps?: string[]
): Promise<TrendAnalysisResponse> {
    try {
        const response = await fetchWithRetry(`${AI_SERVICE_URL}/analyze/trends`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                metric_name: metricName,
                data,
                timestamps,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || `AI Service Error: ${response.statusText}`)
        }

    } catch (error: unknown) {
        console.error('AI Analysis Failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(errorMessage || 'Failed to connect to AI Advisory Service. Please try again later.')
    }
}

export async function checkAIHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/health`)
        return response.ok
    } catch {
        return false
    }
}
