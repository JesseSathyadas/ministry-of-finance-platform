"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import type { ApplicationWithDetails, ApplicationStatus } from "@/lib/types/schemes"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface ApplicationReviewProps {
    applications: ApplicationWithDetails[]
    schemes: Array<{ id: string; name: string }>
    userRole: string
}

export function ApplicationReview({ applications: initialApplications, schemes, userRole }: ApplicationReviewProps) {
    const router = useRouter()
    const [applications, setApplications] = useState(initialApplications)
    const [selectedApp, setSelectedApp] = useState<ApplicationWithDetails | null>(null)
    const [isReviewOpen, setIsReviewOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [reviewNotes, setReviewNotes] = useState("")
    const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all")
    const [filterScheme, setFilterScheme] = useState<string>("all")

    const handleReview = async (status: ApplicationStatus) => {
        if (!selectedApp) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/applications/${selectedApp.id}/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    review_notes: reviewNotes
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to review application')
            }

            setIsReviewOpen(false)
            setSelectedApp(null)
            setReviewNotes("")
            router.refresh()
        } catch (error: any) {
            alert(error.message || 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const openReviewDialog = (app: ApplicationWithDetails) => {
        setSelectedApp(app)
        setReviewNotes(app.review_notes || "")
        setIsReviewOpen(true)
    }

    const getStatusBadge = (status: ApplicationStatus) => {
        const config: Record<ApplicationStatus, { variant: "default" | "success" | "destructive" | "secondary" | "warning"; icon: any }> = {
            pending: { variant: "default", icon: Clock },
            under_review: { variant: "secondary", icon: Eye },
            forwarded_to_admin: { variant: "warning", icon: Eye },
            approved: { variant: "success", icon: CheckCircle },
            rejected: { variant: "destructive", icon: XCircle }
        }

        const { variant, icon: Icon } = config[status]

        return (
            <Badge variant={variant} className="flex items-center gap-1 w-fit">
                <Icon className="h-3 w-3" />
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        )
    }

    const filteredApplications = applications.filter(app => {
        if (filterStatus !== "all" && app.status !== filterStatus) return false
        if (filterScheme !== "all" && app.scheme_id !== filterScheme) return false
        return true
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        Application Review
                        <Badge variant="outline" className="text-sm font-normal text-muted-foreground">
                            Viewing as: <span className="font-semibold capitalize text-foreground ml-1">{userRole.replace('_', ' ')}</span>
                        </Badge>
                    </h2>
                    <p className="text-muted-foreground">Review and approve citizen applications</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <div className="flex-1 space-y-2">
                        <Label>Status</Label>
                        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="under_review">Under Review</SelectItem>
                                <SelectItem value="forwarded_to_admin">Forwarded to Admin</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label>Scheme</Label>
                        <Select value={filterScheme} onValueChange={setFilterScheme}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Schemes</SelectItem>
                                {schemes.map(scheme => (
                                    <SelectItem key={scheme.id} value={scheme.id}>
                                        {scheme.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Applications Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Applications ({filteredApplications.length})</CardTitle>
                    <CardDescription>Click on an application to review</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Citizen</TableHead>
                                <TableHead>Scheme</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredApplications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No applications found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredApplications.map((app) => (
                                    <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openReviewDialog(app)}>
                                        <TableCell className="font-medium">
                                            {app.citizen?.full_name || app.citizen?.email || 'Unknown'}
                                        </TableCell>
                                        <TableCell className="text-sm">{app.scheme?.name || 'Unknown Scheme'}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(app.submitted_at), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={(e) => {
                                                e.stopPropagation()
                                                openReviewDialog(app)
                                            }}>
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Review Dialog */}
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Review Application</DialogTitle>
                        <DialogDescription>
                            Review and approve or reject this application
                        </DialogDescription>
                    </DialogHeader>

                    {selectedApp && (
                        <div className="space-y-6">
                            {/* Citizen Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Citizen</Label>
                                    <p className="font-medium">{selectedApp.citizen?.full_name || selectedApp.citizen?.email}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Submitted</Label>
                                    <p className="font-medium">{format(new Date(selectedApp.submitted_at), 'PPP')}</p>
                                </div>
                            </div>

                            {/* Scheme Info */}
                            <div>
                                <Label className="text-muted-foreground">Scheme</Label>
                                <p className="font-medium text-lg">{selectedApp.scheme?.name}</p>
                                <p className="text-sm text-muted-foreground">{selectedApp.scheme?.ministry}</p>
                            </div>

                            {/* Application Data */}
                            <div>
                                <Label className="text-muted-foreground mb-2 block">Application Details</Label>
                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                    {Object.entries(selectedApp.application_data).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                            <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Current Status */}
                            <div>
                                <Label className="text-muted-foreground">Current Status</Label>
                                <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
                            </div>

                            {/* Review Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Review Notes</Label>
                                <Textarea
                                    id="notes"
                                    rows={4}
                                    placeholder="Add your review notes here..."
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    disabled={selectedApp.status === 'approved' || selectedApp.status === 'rejected'}
                                />
                            </div>

                            {/* Previous Review Info */}
                            {selectedApp.reviewed_by && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <Label className="text-blue-900">Previous Review</Label>
                                    <p className="text-sm text-blue-800 mt-1">
                                        Reviewed by {selectedApp.reviewer?.full_name || selectedApp.reviewer?.email} on{' '}
                                        {selectedApp.reviewed_at && format(new Date(selectedApp.reviewed_at), 'PPP')}
                                    </p>
                                    {selectedApp.review_notes && (
                                        <p className="text-sm text-blue-800 mt-2 italic">"{selectedApp.review_notes}"</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
                            Close
                        </Button>
                        {selectedApp && selectedApp.status !== 'approved' && selectedApp.status !== 'rejected' && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleReview('rejected')}
                                    disabled={isLoading || !reviewNotes.trim()}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>

                                {userRole === 'analyst' ? (
                                    <Button
                                        onClick={() => handleReview('forwarded_to_admin')}
                                        disabled={isLoading || !reviewNotes.trim()}
                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Forward to Admin
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handleReview('approved')}
                                        disabled={isLoading || !reviewNotes.trim()}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve & Disburse
                                    </Button>
                                )}
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
