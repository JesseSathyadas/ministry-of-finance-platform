"use client"

import { useAuth } from "@/components/auth-provider"
import { ROLES, hasRole } from "@/lib/auth/rbac"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, role, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/login")
            } else if (!hasRole(role || undefined, ROLES.ADMIN)) {
                // Not authorized
                router.push("/")
            }
        }
    }, [user, role, isLoading, router])

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading admin console...</div>
    }

    if (!user || !hasRole(role || undefined, ROLES.ADMIN)) {
        return null // Will redirect
    }

    return (
        <div className="flex flex-col space-y-6">
            <div className="border-b pb-4">
                <h2 className="text-3xl font-bold tracking-tight text-red-900 dark:text-red-500">Admin Console</h2>
                <p className="text-muted-foreground">
                    System governance, user management, and audit trails.
                </p>
            </div>
            <div className="flex-1 space-y-4">
                {children}
            </div>
        </div>
    )
}
