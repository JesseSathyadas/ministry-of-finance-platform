export type UserRole = 'public_user' | 'analyst' | 'admin' | 'super_admin'

export const ROLES = {
    PUBLIC: 'public_user',
    ANALYST: 'analyst',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
} as const

// Hierarchy of roles for inequality checks if needed (higher index = more privilege)
const ROLE_HIERARCHY: UserRole[] = ['public_user', 'analyst', 'admin', 'super_admin']

export function hasRole(userRole: string | undefined, requiredRole: UserRole): boolean {
    if (!userRole) return false

    const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole as UserRole)
    const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole)

    if (userRoleIndex === -1 || requiredRoleIndex === -1) return false

    // Strict role check or hierarchical? 
    // Requirement says: "Analyst OR Admin" for analyst pages. 
    // "Admin OR SuperAdmin" for admin pages.
    // So we'll use a hierarchy check: having a higher role grants access to lower role features usually,
    // BUT the prompt is specific. Let's make it flexible.

    return userRoleIndex >= requiredRoleIndex
}

export function isAnalyst(role?: string) {
    return hasRole(role, 'analyst')
}

export function isAdmin(role?: string) {
    return hasRole(role, 'admin')
}

export function isSuperAdmin(role?: string) {
    return role === 'super_admin'
}
