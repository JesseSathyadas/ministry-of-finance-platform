import { createClient } from "@/lib/supabase/server"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendChart } from "@/components/dashboard/trend-chart"
import { InsightPanel } from "@/components/dashboard/insight-panel"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, AlertTriangle } from "lucide-react"

export const revalidate = 0 // Dynamic data

async function getDashboardData() {
    const supabase = createClient()

    // Fetch latest metrics
    const { data: metrics } = await supabase
        .from('financial_metrics')
        .select('*')
        .order('recorded_at', { ascending: true })
        .gte('recorded_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()) // Last year

    // Fetch latest insights
    const { data: insights } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    // Fetch forecast data (simulated join or separate query)
    const { data: forecasts } = await supabase
        .from('forecasts')
        .select('*')
        .order('forecast_date', { ascending: true })

    // Process data for charts
    const revenueData = metrics?.filter(m => m.metric_category === 'revenue').map(m => ({
        date: m.recorded_at,
        value: m.value
    })) || []

    const expenditureData = metrics?.filter(m => m.metric_category === 'expenditure').map(m => ({
        date: m.recorded_at,
        value: m.value
    })) || []

    // Calculate KPIs
    const totalRevenue = revenueData.reduce((acc, curr) => acc + Number(curr.value), 0)
    const totalExpenditure = expenditureData.reduce((acc, curr) => acc + Number(curr.value), 0)
    const deficit = totalRevenue - totalExpenditure

    return {
        revenueData,
        expenditureData,
        insights: insights || [],
        kpis: {
            revenue: totalRevenue,
            expenditure: totalExpenditure,
            deficit
        },
        forecasts: forecasts || []
    }
}

export default async function AnalystDashboard() {
    const data = await getDashboardData()

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* KPI Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total Revenue (YTD)"
                    value={data.kpis.revenue}
                    unit="currency"
                    trend={{ direction: 'up', value: 12.5, label: 'vs last year' }}
                />
                <KPICard
                    title="Total Expenditure (YTD)"
                    value={data.kpis.expenditure}
                    unit="currency"
                    trend={{ direction: 'up', value: 8.2, label: 'vs last year' }}
                />
                <KPICard
                    title="Fiscal Deficit"
                    value={data.kpis.deficit}
                    unit="currency"
                    trend={{ direction: data.kpis.deficit < 0 ? 'down' : 'up', value: 5.1 }}
                />
                <div className="rounded-xl border bg-card p-6 flex flex-col justify-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        Active Alerts
                    </div>
                    <div className="text-2xl font-bold">
                        {data.insights.filter(i => i.severity === 'high' || i.severity === 'critical').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Requires immediate attention</div>
                </div>
            </div>

            <Separator />

            <Tabs defaultValue="overview" className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
                        <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh Data
                        </Button>
                        <Button size="sm">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Run AI Analysis
                        </Button>
                    </div>
                </div>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <div className="col-span-4">
                            <TrendChart
                                title="Revenue vs Expenditure"
                                data={data.revenueData} // Simplified: ideally merge rev/exp by date
                                type="area"
                                color="#0f766e"
                            />
                        </div>
                        <div className="col-span-3">
                            <InsightPanel insights={data.insights} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="trends">
                    <div className="grid gap-4 md:grid-cols-2">
                        <TrendChart
                            title="Revenue Trends"
                            data={data.revenueData}
                            type="line"
                            color="#1e3a8a"
                        />
                        <TrendChart
                            title="Expenditure Trends"
                            data={data.expenditureData}
                            type="line"
                            color="#b91c1c"
                        />
                    </div>
                </TabsContent>

                <TabsContent value="forecasts">
                    <div className="rounded-lg border p-8 text-center text-muted-foreground">
                        <p>Forecasting module visualization would go here (requires merging forecast data with historical)</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
