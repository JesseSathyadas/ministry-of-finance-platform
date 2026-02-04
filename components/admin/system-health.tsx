'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Database, Cpu, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

export interface SystemHealthProps {
    health: {
        database: {
            status: 'healthy' | 'degraded' | 'down'
            responseTime: number
            connections: number
        }
        aiService: {
            status: 'healthy' | 'degraded' | 'down'
            responseTime: number
            lastCheck: string
        }
        application: {
            status: 'healthy' | 'degraded' | 'down'
            uptime: number
            memoryUsage: number
        }
    }
}

export function SystemHealth({ health }: SystemHealthProps) {
    const getStatusConfig = (status: 'healthy' | 'degraded' | 'down') => {
        switch (status) {
            case 'healthy':
                return {
                    icon: CheckCircle2,
                    variant: 'success' as const,
                    color: 'text-green-600',
                    label: 'Operational',
                }
            case 'degraded':
                return {
                    icon: AlertCircle,
                    variant: 'warning' as const,
                    color: 'text-amber-600',
                    label: 'Degraded',
                }
            case 'down':
                return {
                    icon: AlertCircle,
                    variant: 'destructive' as const,
                    color: 'text-red-600',
                    label: 'Down',
                }
        }
    }

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)

        if (days > 0) return `${days}d ${hours}h`
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes}m`
    }

    const services = [
        {
            name: 'Database',
            icon: Database,
            status: health.database.status,
            metrics: [
                { label: 'Response Time', value: `${health.database.responseTime}ms` },
                { label: 'Connections', value: health.database.connections.toString() },
            ],
        },
        {
            name: 'AI Service',
            icon: Cpu,
            status: health.aiService.status,
            metrics: [
                { label: 'Response Time', value: `${health.aiService.responseTime}ms` },
                { label: 'Last Check', value: new Date(health.aiService.lastCheck).toLocaleTimeString('en-IN') },
            ],
        },
        {
            name: 'Application',
            icon: Activity,
            status: health.application.status,
            metrics: [
                { label: 'Uptime', value: formatUptime(health.application.uptime) },
                { label: 'Memory', value: `${health.application.memoryUsage.toFixed(1)}%` },
            ],
        },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Health
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                    {services.map((service, index) => {
                        const config = getStatusConfig(service.status)
                        const Icon = service.icon
                        const StatusIcon = config.icon

                        return (
                            <motion.div
                                key={service.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="rounded-lg border p-4 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                        <h4 className="font-semibold">{service.name}</h4>
                                    </div>
                                    <Badge variant={config.variant}>
                                        <StatusIcon className="h-3 w-3 mr-1" />
                                        {config.label}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    {service.metrics.map((metric) => (
                                        <div key={metric.label} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{metric.label}</span>
                                            <span className="font-medium">{metric.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                <div className="mt-6 p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold text-sm mb-2">Overall System Status</h4>
                    <div className="flex items-center gap-2">
                        {health.database.status === 'healthy' &&
                            health.aiService.status === 'healthy' &&
                            health.application.status === 'healthy' ? (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <span className="text-sm">All systems operational</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                <span className="text-sm">Some systems require attention</span>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
