import { createClient } from "@/lib/supabase/server"
import { MetricCard } from "@/components/metric-card"
import { TrendChart } from "@/components/trend-chart"
import { Separator } from "@/components/ui/separator"
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export const revalidate = 3600 // Revalidate every hour

export default async function PublicDashboard() {
    const supabase = createClient()

    // Fetch public financial metrics
    const { data: metrics, error } = await supabase
        .from('financial_metrics')
        .select('*')
        .eq('is_public', true)
        .order('recorded_at', { ascending: true })

    if (error) {
        console.error('Error fetching public metrics:', error)
        return <div className="p-8 text-destructive">Failed to load public data. Please try again later.</div>
    }

    const publicData = metrics || []

    // Process data for charts
    // Group by metric_name to find unique metrics
    const uniqueMetrics = Array.from(new Set(publicData.map(m => m.metric_name)))

    // Aggregate data for the main chart (group by date/fiscal_year)
    // This is a simplified transformation for demo purposes. 
    // In a real app, you might want more complex time-series alignment.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chartData = publicData.reduce((acc: any[], curr) => {
        // Determine a label (e.g., Fiscal Year + Quarter)
        const label = `FY${curr.fiscal_year} Q${curr.fiscal_quarter}`

        let existingPoint = acc.find(p => p.label === label)
        if (!existingPoint) {
            existingPoint = { label }
            acc.push(existingPoint)
        }

        existingPoint[curr.metric_name] = curr.value
        return acc
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, []).sort((a: any, b: any) => a.label.localeCompare(b.label)) // Simple sort

    // Calculate latest values for KPI cards
    const kpis = uniqueMetrics.map(name => {
        const history = publicData.filter(d => d.metric_name === name).sort((a, b) =>
            new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
        )

        if (history.length === 0) return null

        const latest = history[0]
        const previous = history[1]

        let trend: "up" | "down" | "neutral" = "neutral"

        if (previous) {
            if (latest.value > previous.value) trend = "up"
            else if (latest.value < previous.value) trend = "down"
        }

        return {
            name: latest.metric_name,
            value: latest.value,
            unit: latest.unit,
            trend,
            date: new Date(latest.recorded_at).toLocaleDateString()
        }
    }).filter(Boolean)

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex flex-col space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Financial Dashboard
                </h1>
                <p className="text-xl text-muted-foreground">
                    Public transparency report and scheme management.
                </p>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {kpis.map((kpi: any) => (
                    <MetricCard
                        key={kpi.name}
                        title={kpi.name}
                        value={`${kpi.unit === 'INR' ? '₹' : ''}${kpi.value.toLocaleString()} ${kpi.unit !== 'INR' ? kpi.unit : ''}`}
                        description={`Last updated: ${kpi.date}`}
                        trend={kpi.trend}
                        trendValue={kpi.trend !== "neutral" ? "vs last quarter" : undefined}
                    />
                ))}
                {kpis.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-10 border border-dashed rounded-lg">
                        No public metrics available currently.
                    </div>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-1">
                <TrendChart
                    title="Historical Performance Trends"
                    description="Fiscal Year Quarterly Performance (Public Data)"
                    data={chartData}
                    xAxisKey="label"
                    lines={uniqueMetrics.map((name, i) => ({
                        key: name as string,
                        color: `hsl(${210 + (i * 30)}, 70%, 50%)`  // Generate distinct blues/cyans
                    }))}
                />
            </div>

            <div className="bg-muted/50 p-6 rounded-lg border">
                <h3 className="font-semibold text-lg mb-2">Government Data Transparency</h3>
                <p className="text-sm text-muted-foreground">
                    This dashboard displays official financial metrics approved for public release.
                    The data is sourced directly from the Ministry&apos;s central database (`financial_metrics` table)
                    where `is_public` flag is enabled.
                </p>
                <div className="mt-4 flex gap-4">
                    <Link href="/login">
                        <Button variant="outline">Staff Login</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
