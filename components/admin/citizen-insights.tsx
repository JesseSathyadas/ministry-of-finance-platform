'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Users } from 'lucide-react'

// Aggregated stats only - NO PII
interface AggregatedStats {
    totalChecks: number
    eligibleCount: number
    topScheme: string
    activeRegion: string
}

export function CitizenInsights({ stats }: { stats: AggregatedStats }) {
    const conversionRate = stats.totalChecks > 0
        ? Math.round((stats.eligibleCount / stats.totalChecks) * 100)
        : 0

    return (
        <Card className="border-l-4 border-l-gov-teal">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-gov-teal" />
                    Citizen Services Impact
                    <Badge variant="outline" className="ml-auto font-normal text-xs uppercase tracking-widest">Aggregated</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Eligibility Checks</p>
                        <p className="text-2xl font-bold font-mono">{stats.totalChecks.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Eligibility Rate</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold font-mono">{conversionRate}%</p>
                            <span className="text-xs text-muted-foreground">({stats.eligibleCount})</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Most Popular Scheme</p>
                        <p className="text-sm font-medium truncate" title={stats.topScheme}>{stats.topScheme}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Top Region</p>
                        <p className="text-sm font-medium">{stats.activeRegion}</p>
                    </div>
                </div>
                <div className="mt-4 p-2 bg-muted/20 rounded border text-xs text-muted-foreground flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    <span>Real-time aggregation. Individual citizen data is shielded via RLS and never exposed here.</span>
                </div>
            </CardContent>
        </Card>
    )
}
