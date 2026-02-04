import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"

interface MetricCardProps {
    title: string
    value: string | number
    description?: string
    trend?: "up" | "down" | "neutral"
    trendValue?: string
    footer?: React.ReactNode
}

export function MetricCard({ title, value, description, trend, trendValue, footer }: MetricCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {trend && (
                    <div className="flex items-center text-sm">
                        {trend === "up" && <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />}
                        {trend === "down" && <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />}
                        {trend === "neutral" && <MinusIcon className="mr-1 h-4 w-4 text-gray-500" />}
                        <span className={trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-500"}>
                            {trendValue}
                        </span>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
                {footer && <div className="mt-4">{footer}</div>}
            </CardContent>
        </Card>
    )
}
