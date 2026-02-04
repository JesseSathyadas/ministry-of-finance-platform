'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatNumber, formatDate } from '@/lib/utils'

export interface TrendChartProps {
    title: string
    data: Array<{
        date: string
        value: number
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any
    }>
    dataKey?: string
    valueFormatter?: (value: number) => string
    type?: 'line' | 'area'
    color?: string
    height?: number
    showGrid?: boolean
    showLegend?: boolean
}

export function TrendChart({
    title,
    data,
    dataKey = 'value',
    valueFormatter,
    type = 'line',
    color = '#1e3a8a',
    height = 300,
    showGrid = true,
    showLegend = false,
}: TrendChartProps) {
    const formatValue = (value: number) => {
        if (valueFormatter) {
            return valueFormatter(value)
        }
        return formatNumber(value)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border bg-background p-3 shadow-md">
                    <p className="text-sm font-medium">{formatDate(label)}</p>
                    <p className="text-sm text-muted-foreground">
                        {formatValue(payload[0].value)}
                    </p>
                </div>
            )
        }
        return null
    }

    const commonElements = (
        <>
            {showGrid && (
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            )}
            <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                }}
                className="text-xs"
            />
            <YAxis
                tickFormatter={formatValue}
                className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
        </>
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                    {type === 'area' ? (
                        <AreaChart data={data}>
                            {commonElements}
                            <Area
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                fill={color}
                                fillOpacity={0.2}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </AreaChart>
                    ) : (
                        <LineChart data={data}>
                            {commonElements}
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
