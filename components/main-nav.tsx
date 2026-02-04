"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { hasRole, ROLES } from "@/lib/auth/rbac"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { LogOut } from "lucide-react"

export function MainNav() {
    const pathname = usePathname()
    const { user, role, isLoading } = useAuth()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    if (isLoading) return <div className="h-16 border-b" /> // Skeleton placeholder

    const navItems = [
        {
            title: "Overview",
            href: "/",
            requiredRole: ROLES.PUBLIC,
            showAlways: true
        },
        {
            title: "Schemes & Eligibility", // NEW CITIZEN MODULE
            href: "/citizen/schemes",
            requiredRole: ROLES.PUBLIC,
            showAlways: true
        },
        {
            title: "My Applications",
            href: "/citizen/applications",
            requiredRole: ROLES.PUBLIC,
            showAlways: false,
            requireAuth: true // Only show if authenticated
        },
        {
            title: "Analyst Workspace",
            href: "/analyst",
            requiredRole: ROLES.ANALYST,
            showAlways: false
        },
        {
            title: "Applications",
            href: "/analyst/applications",
            requiredRole: ROLES.ANALYST,
            showAlways: false
        },
        {
            title: "Admin Console",
            href: "/admin",
            requiredRole: ROLES.ADMIN,
            showAlways: false
        }
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center mx-auto px-4 md:px-6">
                <div className="mr-8 flex items-center gap-2">
                    {/* Emblem Placeholder */}
                    <div className="h-8 w-8 rounded-full bg-gov-navy-900 border-2 border-gov-gold flex items-center justify-center text-white font-serif font-bold text-xs">
                        FP
                    </div>
                    <Link href="/" className="hidden md:flex flex-col leading-none">
                        <span className="text-lg font-heading font-bold tracking-tight text-gov-navy-900 dark:text-gray-100">Finance Platform</span>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Gov-Tech Demo</span>
                    </Link>
                </div>

                <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                    {navItems.map((item: any) => {
                        const canView = item.showAlways || hasRole(role || undefined, item.requiredRole)
                        const needsAuth = item.requireAuth && !user
                        if (!canView || needsAuth) return null

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "transition-colors hover:text-gov-blue-light",
                                    pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                                        ? "text-gov-blue font-semibold border-b-2 border-gov-blue pb-1" // Active state
                                        : "text-muted-foreground"
                                )}
                            >
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>

                <div className="flex flex-1 items-center justify-end space-x-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-sm font-medium text-gov-navy-700 dark:text-gray-200">
                                    {user.email?.split('@')[0]}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider border px-1 rounded">
                                    {role?.replace('_', ' ')}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSignOut}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/login">
                                <Button variant="outline" size="sm" className="border-gov-blue text-gov-blue hover:bg-gov-blue-50">Citizen Login</Button>
                            </Link>
                            <Link href="/signup">
                                <Button variant="default" size="sm" className="bg-gov-blue hover:bg-gov-blue-dark">Sign Up</Button>
                            </Link>
                            <Link href="/staff-login">
                                <Button variant="ghost" size="sm">Staff Access</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
