"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"

// Simple mock login since full Auth UI wasn't the main task but is needed for flow
export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Attempt sign in
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            alert(error.message)
        } else {
            // Check for profile to route correctly, but default to citizen home
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profile && ['admin', 'super_admin', 'analyst'].includes(profile.role)) {
                    // If staff logs in here by mistake, route them right
                    if (profile.role === 'analyst') router.push("/analyst/applications")
                    else router.push("/admin")
                } else {
                    router.push("/citizen/schemes")
                }
            } else {
                router.push("/citizen/schemes")
            }
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Citizen Login</CardTitle>
                    <CardDescription>Access your benefits and track applications.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                    <div className="mt-4 text-center space-y-2">
                        <div className="text-xs text-muted-foreground">
                            <p>Demo Citizen:</p>
                            <p>citizen@gmail.com / password123</p>
                        </div>
                        <div className="border-t pt-2">
                            <a href="/staff-login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                Are you a government official? Login here
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
