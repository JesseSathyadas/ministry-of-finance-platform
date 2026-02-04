"use client"

import { useState } from "react"
import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, Clock, Eye, FileText } from "lucide-react"
import type { ApplicationWithDetails, ApplicationStatus } from "@/lib/types/schemes"
import { format } from "date-fns"

interface MyApplicationsClientProps {
    applications: ApplicationWithDetails[]
}

export function MyApplicationsClient({ applications }: MyApplicationsClientProps) {
    const [selectedApp, setSelectedApp] = useState<ApplicationWithDetails | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const getStatusConfig = (status: ApplicationStatus) => {
        const config: Record<ApplicationStatus, { variant: "default" | "success" | "destructive" | "secondary"; icon: any; color: string }> = {
            pending: { variant: "default", icon: Clock, color: "text-yellow-600" },
            under_review: { variant: "secondary", icon: Eye, color: "text-blue-600" },
            approved: { variant: "success", icon: CheckCircle, color: "text-green-600" },
            rejected: { variant: "destructive", icon: XCircle, color: "text-red-600" }
        }

        return config[status]
    }

    const openDetails = (app: ApplicationWithDetails) => {
        setSelectedApp(app)
        setIsDetailsOpen(true)
    }

    if (applications.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                    <p className="text-muted-foreground mb-4">
                        You haven't applied for any schemes yet.
                    </p>
                    <Button asChild>
                        <a href="/citizen/schemes">Browse Schemes</a>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="grid gap-4">
                {applications.map((app) => {
                    const statusConfig = getStatusConfig(app.status)
                    const Icon = statusConfig.icon

                    return (
                        <Card key={app.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl">{app.scheme?.name}</CardTitle>
                                        <CardDescription className="mt-1">
                                            {app.scheme?.ministry}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                                        <Icon className="h-3 w-3" />
                                        {app.status.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Timeline */}
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-blue-600" />
                                            </div>
                                            {app.reviewed_at && (
                                                <>
                                                    <div className="w-0.5 h-8 bg-gray-200" />
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${app.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                                                        }`}>
                                                        <Icon className={`h-4 w-4 ${statusConfig.color}`} />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <p className="font-medium">Application Submitted</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(app.submitted_at), 'PPP')}
                                                </p>
                                            </div>
                                            {app.reviewed_at && (
                                                <div>
                                                    <p className="font-medium">
                                                        {app.status === 'approved' ? 'Approved' : 'Rejected'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(app.reviewed_at), 'PPP')}
                                                    </p>
                                                    {app.review_notes && (
                                                        <p className="text-sm mt-2 italic">
                                                            "{app.review_notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex justify-end pt-4 border-t">
                                        <Button variant="outline" onClick={() => openDetails(app)}>
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Application Details</DialogTitle>
                        <DialogDescription>
                            Complete information about your application
                        </DialogDescription>
                    </DialogHeader>

                    {selectedApp && (
                        <div className="space-y-6">
                            {/* Scheme Info */}
                            <div>
                                <h3 className="font-semibold text-lg mb-2">{selectedApp.scheme?.name}</h3>
                                <p className="text-sm text-muted-foreground">{selectedApp.scheme?.ministry}</p>
                                <p className="text-sm mt-2">{selectedApp.scheme?.description}</p>
                            </div>

                            {/* Status */}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                                <Badge variant={getStatusConfig(selectedApp.status).variant} className="flex items-center gap-1 w-fit">
                                    {React.createElement(getStatusConfig(selectedApp.status).icon, { className: "h-3 w-3" })}
                                    {selectedApp.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                            </div>

                            {/* Application Data */}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">Submitted Information</p>
                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                    {Object.entries(selectedApp.application_data).map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-sm">
                                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                            <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Review Information */}
                            {selectedApp.reviewed_at && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Review Information</p>
                                    <div className={`p-4 rounded-lg ${selectedApp.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                                        }`}>
                                        <p className="text-sm">
                                            <strong>Reviewed on:</strong> {format(new Date(selectedApp.reviewed_at), 'PPP')}
                                        </p>
                                        {selectedApp.reviewer && (
                                            <p className="text-sm mt-1">
                                                <strong>Reviewed by:</strong> {selectedApp.reviewer.full_name || selectedApp.reviewer.email}
                                            </p>
                                        )}
                                        {selectedApp.review_notes && (
                                            <p className="text-sm mt-2 italic">
                                                "{selectedApp.review_notes}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Pending Message */}
                            {selectedApp.status === 'pending' && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        Your application is pending review. You will be notified once it has been processed.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
