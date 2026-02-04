"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { analyzeTrends, TrendAnalysisResponse } from "@/lib/ai/client"
import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/audit/logger"
import { useAuth } from "@/components/auth-provider"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function TrendAnalysisPage() {
    const [metrics, setMetrics] = useState<string[]>([])
    const [selectedMetric, setSelectedMetric] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<TrendAnalysisResponse | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)

    const supabase = createClient()

    // Load available metrics
    useEffect(() => {
        const fetchMetrics = async () => {
            const { data } = await supabase.from('financial_metrics').select('metric_name')
            if (data) {
                const unique = Array.from(new Set(data.map(d => d.metric_name)))
                setMetrics(unique)
            }
        }
        fetchMetrics()
    }, [])

    const { role } = useAuth()
    // STRICT GOVERNANCE: Admins can view this page but MUST NOT trigger analysis.
    // Only 'analyst' role (or maybe super_admin if debugging, but rule says "Admins MUST NOT").
    // We'll restrict query execution to 'analyst' role strictly.
    const isAnalyst = role === 'analyst'

    const handleRunAnalysis = async () => {
        if (!selectedMetric) return
        if (!isAnalyst) {
            alert("Restricted: Only Analysts can trigger AI analysis. Admins typically have governance-only access.")
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)
        setReviewStatus(null)

        try {
            // 1. Log the trigger
            await logger.log({
                action: 'ai_analysis_triggered',
                resource_type: 'financial_metrics',
                details: { metric: selectedMetric, tool: 'trend_analysis' }
            })

            // 2. Fetch data for the metric
            const { data: metricData, error: dbError } = await supabase
                .from('financial_metrics')
                .select('value, recorded_at')
                .eq('metric_name', selectedMetric)
                .order('recorded_at', { ascending: true })

            if (dbError || !metricData || metricData.length < 2) {
                throw new Error("Insufficient data for analysis")
            }

            const values = metricData.map(d => d.value)
            const timestamps = metricData.map(d => d.recorded_at)

            // 3. Call AI Service
            const analysis = await analyzeTrends(selectedMetric, values, timestamps)
            setResult(analysis)
            setReviewStatus('pending')

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    const handleReview = async (status: 'approved' | 'rejected') => {
        if (!result) return

        try {
            setReviewStatus(status)

            // Log the decision
            await logger.log({
                action: status === 'approved' ? 'ai_insight_approved' : 'ai_insight_rejected',
                resource_type: 'trend_results',
                details: {
                    metric: selectedMetric,
                    confidence: result.confidence,
                    reason: status === 'rejected' ? 'Analyst rejected advisory' : 'Analyst confirmed advisory'
                }
            })

            if (status === 'approved') {
                // Persist to DB only on approval
                await supabase.from('trend_results').insert({
                    metric_name: result.metric_name,
                    trend_direction: result.trend_direction,
                    slope: result.slope,
                    confidence: result.confidence,
                    explanation: result.explanation,
                    data_points_analyzed: result.data_points_analyzed
                })
            }

        } catch (e) {
            console.error("Failed to save review", e)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Trend Analysis Tool</h1>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>Configure Analysis</CardTitle>
                    <CardDescription>Select a metric to run AI trend detection. Results are advisory only.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Metric</label>
                        <Select onValueChange={setSelectedMetric} value={selectedMetric}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select metric..." />
                            </SelectTrigger>
                            <SelectContent>
                                {metrics.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select >
                    </div >
                </CardContent >
                <CardFooter>
                    <Button onClick={handleRunAnalysis} disabled={!selectedMetric || loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Analyzing..." : "Run Analysis"}
                    </Button>
                </CardFooter>
            </Card >

            {error && (
                <div className="p-4 border border-destructive/50 text-destructive rounded-md flex items-center bg-destructive/10">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                </div>
            )
            }

            {
                result && (
                    <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                AI Insight Needed Review
                                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Advisory</span>
                            </CardTitle>
                            <CardDescription>Please review the generated insight for accuracy.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-muted-foreground">Trend</span>
                                    <div className="font-medium capitalize">{result.trend_direction}</div>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Confidence</span>
                                    <div className="font-medium">{result.confidence}%</div>
                                </div>
                            </div>
                            <div className="bg-background p-4 rounded-md border">
                                <p className="text-sm">{result.explanation}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6">
                            {reviewStatus === 'pending' ? (
                                <div className="flex gap-4 w-full">
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleReview('rejected')}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" /> Reject
                                    </Button>
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        onClick={() => handleReview('approved')}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" /> Approve & Publish
                                    </Button>
                                </div>
                            ) : (
                                <div className="w-full text-center py-2 flex items-center justify-center gap-2">
                                    {reviewStatus === 'approved' ? (
                                        <>
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <span className="text-green-600 font-medium">Insight Approved and Logged</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-5 w-5 text-destructive" />
                                            <span className="text-destructive font-medium">Insight Rejected</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                )
            }
        </div >
    )
}
