'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import { Search, Filter } from 'lucide-react'

export interface AuditLog {
    id: string
    user_email: string
    user_role: string
    action: string
    resource_type: string
    resource_id?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: any
    created_at: string
}

export interface AuditLogViewerProps {
    logs: AuditLog[]
}

export function AuditLogViewer({ logs }: AuditLogViewerProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterAction, setFilterAction] = useState<string>('all')

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.resource_type.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesFilter = filterAction === 'all' || log.action === filterAction

        return matchesSearch && matchesFilter
    })

    const getActionBadgeVariant = (action: string) => {
        switch (action) {
            case 'create':
                return 'success'
            case 'read':
                return 'info'
            case 'update':
                return 'warning'
            case 'delete':
                return 'destructive'
            case 'login':
            case 'logout':
                return 'secondary'
            case 'config_change':
                return 'warning'
            default:
                return 'default'
        }
    }

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'super_admin':
                return 'destructive'
            case 'admin':
                return 'warning'
            case 'analyst':
                return 'info'
            default:
                return 'secondary'
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <div className="flex gap-4 mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by user or resource..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="pl-10 pr-8 py-2 border rounded-md bg-background appearance-none"
                        >
                            <option value="all">All Actions</option>
                            <option value="create">Create</option>
                            <option value="read">Read</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="login">Login</option>
                            <option value="logout">Logout</option>
                            <option value="config_change">Config Change</option>
                        </select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border h-[600px] overflow-auto relative">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Resource</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        No audit logs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-xs">
                                            {formatDateTime(log.created_at)}
                                        </TableCell>
                                        <TableCell className="font-medium">{log.user_email}</TableCell>
                                        <TableCell>
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            <Badge variant={getRoleBadgeVariant(log.user_role) as any}>
                                                {log.user_role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            <Badge variant={getActionBadgeVariant(log.action) as any}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">
                                                {log.resource_type}
                                                {log.resource_id && (
                                                    <span className="text-muted-foreground text-xs ml-1">
                                                        ({log.resource_id.slice(0, 8)}...)
                                                    </span>
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {log.details && (
                                                <details className="cursor-pointer">
                                                    <summary className="text-xs text-muted-foreground hover:text-foreground">
                                                        View
                                                    </summary>
                                                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-w-md">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                    Showing {filteredLogs.length} of {logs.length} logs
                </div>
            </CardContent>
        </Card>
    )
}
