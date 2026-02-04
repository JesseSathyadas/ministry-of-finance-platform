'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'

export interface KPICardProps {
    title: string
    value: number
    unit?: 'currency' | 'number' | 'percentage'
    currency?: string
    trend?: {
        direction: 'up' | 'down' | 'stable'
        value: number
        label?: string
    }
    change?: {
        value: number
        period: string
    }
    className?: string
}

export function KPICard({
    title,
    value,
    unit = 'number',
    currency = 'INR',
    trend,
    change,
    className,
}: KPICardProps) {
    const formatValue = () => {
        switch (unit) {
            case 'currency':
                return formatCurrency(value, currency)
            case 'percentage':
                return formatPercentage(value)
            case 'number':
            default:
                return formatNumber(value)
        }
    }

    const getTrendIcon = () => {
        if (!trend) return null

        switch (trend.direction) {
            case 'up':
                return <TrendingUp className="h-4 w-4 text-green-600" />
            case 'down':
                return <TrendingDown className="h-4 w-4 text-red-600" />
            case 'stable':
                return <Minus className="h-4 w-4 text-gray-600" />
        }
    }

    const getTrendColor = () => {
        if (!trend) return 'default'

        switch (trend.direction) {
            case 'up':
                return 'success'
            case 'down':
                return 'destructive'
            case 'stable':
                return 'secondary'
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={className}
        >
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="text-2xl font-bold">{formatValue()}</div>

                        <div className="flex items-center gap-2">
                            {trend && (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                <Badge variant={getTrendColor() as any} className="flex items-center gap-1">
                                    {getTrendIcon()}
                                    <span className="text-xs">
                                        {trend.label || trend.direction}
                                    </span>
                                </Badge>
                            )}

                            {change && (
                                <span className="text-xs text-muted-foreground">
                                    {change.value > 0 ? '+' : ''}
                                    {formatPercentage(change.value, 1)} {change.period}
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
