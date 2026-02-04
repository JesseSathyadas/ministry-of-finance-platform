
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This is a special dev tool helper to force-fix roles
export async function GET(request: NextRequest) {
    const supabase = createClient()

    // 1. Get the users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    // Note: listUsers() usually requires Service Role key if not in local dev with proper permissions.
    // However, in this local setup, RLS might block us from seeing *other* users if we are just "authenticated".
    // WE NEED SERVICE ROLE CLIENT for this.
    // Accessing ENV vars directly for service role if available, or trying normally.

    // Force updates for the specific emails
    const updates = [
        { email: 'jessemonu999@gmail.com', role: 'admin' },
        { email: 'jessemonu333@gmail.com', role: 'analyst' }
    ]

    const results = []

    for (const update of updates) {
        // Find profile by email (if RLS allows, or we need to relax RLS for this fix)
        // Since we can't easily get the UUID without admin access, we'll try to update purely by email 
        // IF the user_profiles table allows it. But user_profiles key is ID.

        // Strategy: We will use a direct SQL via RPC if possible, or assume the client session 
        // can't do this easily.

        // Simpler approach for the User: return the SQL they need to run if we fail, 
        // OR rely on the fact that if they visit this page, maybe we can upgrade *THEM*.

        // Let's try to update the current user if they match.
        const { data: { user } } = await supabase.auth.getUser()

        if (user && user.email === update.email) {
            // Update their own profile
            const { error } = await supabase
                .from('user_profiles')
                .update({ role: update.role })
                .eq('id', user.id)

            if (error) {
                results.push(`Failed to update ${update.email}: ${error.message}`)
            } else {
                results.push(`Successfully updated ${update.email} to ${update.role}`)
            }
        }
    }

    return NextResponse.json({
        message: "Role update attempt complete. Note: You must be logged in as the user you want to update for this specific script to work in this restricted mode.",
        results
    })
}
