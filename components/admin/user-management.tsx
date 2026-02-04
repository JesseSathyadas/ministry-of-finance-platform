'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { UserRole } from '@/lib/auth/rbac'
import { Users, UserPlus, Shield, Loader2 } from 'lucide-react'

export interface UserProfile {
    id: string
    email: string
    full_name: string | null
    role: UserRole
    department: string | null
    is_active: boolean
    created_at: string
}

export interface UserManagementProps {
    users: UserProfile[]
    onUpdateRole?: (userId: string, newRole: UserRole) => Promise<void>
    onToggleActive?: (userId: string, isActive: boolean) => Promise<void>
    onCreateUser?: (data: { email: string; fullName: string; role: UserRole }) => Promise<any>
}

export function UserManagement({ users, onUpdateRole, onToggleActive, onCreateUser }: UserManagementProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [showInviteDialog, setShowInviteDialog] = useState(false)

    // New User Form State
    const [newUser, setNewUser] = useState({
        email: '',
        fullName: '',
        role: 'analyst' as UserRole
    })

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        if (!onUpdateRole) return

        setIsLoading(userId)
        try {
            await onUpdateRole(userId, newRole)
        } catch (error: any) {
            alert(`Failed to update role: ${error.message}`)
        } finally {
            setIsLoading(null)
        }
    }

    const handleToggleActive = async (userId: string, isActive: boolean) => {
        if (!onToggleActive) return

        setIsLoading(userId)
        try {
            await onToggleActive(userId, !isActive)
        } catch (error: any) {
            alert(`Failed to update status: ${error.message}`)
        } finally {
            setIsLoading(null)
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!onCreateUser) return

        setIsCreating(true)
        try {
            await onCreateUser(newUser)
            setShowInviteDialog(false)
            setNewUser({ email: '', fullName: '', role: 'analyst' })
            alert("User created successfully!")
        } catch (error: any) {
            alert(`Failed to create user: ${error.message}`)
        } finally {
            setIsCreating(false)
        }
    }

    const roleOptions: UserRole[] = ['public_user', 'analyst', 'admin', 'super_admin']

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Management
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setShowInviteDialog(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite User
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{user.full_name || 'N/A'}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{user.department || 'N/A'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                disabled={isLoading === user.id}
                                                className="text-sm border rounded px-2 py-1 bg-background"
                                            >
                                                {roleOptions.map((role) => (
                                                    <option key={role} value={role}>
                                                        {role}
                                                    </option>
                                                ))}
                                            </select>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.is_active ? 'success' : 'secondary'}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString('en-IN')}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleActive(user.id, user.is_active)}
                                                disabled={isLoading === user.id}
                                            >
                                                {isLoading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (user.is_active ? 'Deactivate' : 'Activate')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Total Users: {users.length}</span>
                    </div>
                </div>
            </CardContent>

            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite New User</DialogTitle>
                        <DialogDescription>
                            Create a new account for a staff member or citizen.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                value={newUser.fullName}
                                onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                                placeholder="Jane Doe"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                value={newUser.email}
                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="jane@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <select
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                                className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                                {roleOptions.map((role) => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="bg-muted p-3 rounded text-xs text-muted-foreground">
                            Default password will be set to: <strong>TemporaryPassword123!</strong>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating ? "Creating..." : "Create User"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
