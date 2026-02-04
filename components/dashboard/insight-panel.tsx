'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical'

export interface InsightPanelProps {
    insights: Array<{
        id: string
        title: string
        insight: string
        severity: SeverityLevel
        confidence: number
        recommendation?: string
        created_at: string
    }>
    maxItems?: number
}

export function InsightPanel({ insights, maxItems = 5 }: InsightPanelProps) {
    const displayedInsights = insights.slice(0, maxItems)

    const getSeverityConfig = (severity: SeverityLevel) => {
        switch (severity) {
            case 'critical':
                return {
                    icon: AlertCircle,
                    variant: 'destructive' as const,
                    color: 'text-red-600',
                    bgColor: 'bg-red-50 dark:bg-red-950',
                }
            case 'high':
                return {
                    icon: AlertTriangle,
                    variant: 'warning' as const,
                    color: 'text-orange-600',
                    bgColor: 'bg-orange-50 dark:bg-orange-950',
                }
            case 'medium':
                return {
                    icon: Info,
                    variant: 'info' as const,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50 dark:bg-blue-950',
                }
            case 'low':
            default:
                return {
                    icon: Lightbulb,
                    variant: 'success' as const,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50 dark:bg-green-950',
                }
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    AI Insights
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {displayedInsights.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No insights available at this time.
                    </p>
                ) : (
                    displayedInsights.map((insight, index) => {
                        const config = getSeverityConfig(insight.severity)
                        const Icon = config.icon

                        return (
                            <motion.div
                                key={insight.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className={`rounded-lg border p-4 ${config.bgColor}`}
                            >
                                <div className="flex items-start gap-3">
                                    <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-semibold text-sm">{insight.title}</h4>
                                            <Badge variant={config.variant} className="text-xs">
                                                {insight.severity}
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                            {insight.insight}
                                        </p>

                                        {insight.recommendation && (
                                            <div className="mt-2 pt-2 border-t">
                                                <p className="text-xs font-medium">Recommendation:</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {insight.recommendation}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Confidence: {insight.confidence.toFixed(1)}%</span>
                                            <span>{new Date(insight.created_at).toLocaleDateString('en-IN')}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </CardContent>
        </Card>
    )
}
