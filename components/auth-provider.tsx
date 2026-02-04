"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/lib/auth/rbac'

interface AuthContextType {
    user: User | null
    session: Session | null
    role: UserRole | null
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [role, setRole] = useState<UserRole | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        let isMounted = true

        const determineRole = async (userId: string, email: string | undefined): Promise<UserRole> => {
            // DEMO OVERRIDE: Hardcode roles for specific emails
            if (email === 'jessemonu999@gmail.com') {
                console.log("✅ ADMIN override: jessemonu999@gmail.com")
                return 'admin'
            }
            if (email === 'jessemonu333@gmail.com') {
                console.log("✅ ANALYST override: jessemonu333@gmail.com")
                return 'analyst'
            }
            if (email?.includes('admin@')) {
                console.log("✅ ADMIN override: email contains admin@")
                return 'admin'
            }

            // Fetch from database
            try {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', userId)
                    .single()

                if (error) {
                    console.error('❌ Error fetching role:', error.message)
                    return 'public_user'
                }

                return (data?.role as UserRole) || 'public_user'
            } catch (err) {
                console.error('❌ Failed to fetch role', err)
                return 'public_user'
            }
        }

        const initializeAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession()
                if (!isMounted) return

                setSession(currentSession)
                setUser(currentSession?.user ?? null)

                if (currentSession?.user) {
                    const userRole = await determineRole(currentSession.user.id, currentSession.user.email)
                    if (isMounted) {
                        setRole(userRole)
                        setIsLoading(false)
                    }
                } else {
                    setRole('public_user')
                    setIsLoading(false)
                }
            } catch (error) {
                console.error('❌ Auth initialization error:', error)
                if (isMounted) {
                    setRole('public_user')
                    setIsLoading(false)
                }
            }
        }

        initializeAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                if (!isMounted) return

                setSession(newSession)
                setUser(newSession?.user ?? null)

                if (newSession?.user) {
                    const userRole = await determineRole(newSession.user.id, newSession.user.email)
                    if (isMounted) {
                        setRole(userRole)
                        setIsLoading(false)
                    }
                } else {
                    setRole('public_user')
                    setIsLoading(false)
                }
            }
        )

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [])

    return (
        <AuthContext.Provider value={{ user, session, role, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
