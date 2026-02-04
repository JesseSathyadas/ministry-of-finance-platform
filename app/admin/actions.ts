'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { UserRole } from "@/lib/auth/rbac"
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Admin client for privileged operations (bypasses RLS)
function getAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        console.warn("SUPABASE_SERVICE_ROLE_KEY not found. Admin user creation will fail.")
        // Return null to indicate we can't create admin client
        return null
    }

    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

export async function createUser(data: { email: string; fullName: string; role: UserRole; password?: string }) {
    const adminClient = getAdminClient()

    if (!adminClient) {
        throw new Error("Admin user creation requires SUPABASE_SERVICE_ROLE_KEY to be set in environment variables. Please add it to your .env file.")
    }

    try {
        // 1. Create User in Auth using admin API
        const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
            email: data.email,
            password: data.password || 'TemporaryPassword123!',
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: data.fullName
            }
        })

        if (createError) {
            console.error("Create user error:", createError)
            throw new Error(createError.message)
        }

        if (!userData.user) {
            throw new Error("Failed to create user - no user data returned")
        }

        // 2. The database trigger should auto-create the profile with 'public_user' role
        // But we need to update it to the desired role
        // Wait a tiny bit for trigger to fire
        await new Promise(resolve => setTimeout(resolve, 500))

        // 3. Update the role to what admin specified
        const { error: profileError } = await adminClient
            .from('user_profiles')
            .update({
                role: data.role,
                full_name: data.fullName
            })
            .eq('id', userData.user.id)

        if (profileError) {
            console.error("Profile update failed:", profileError)
            // Don't throw - user is created, just role might be wrong
            // Admin can fix it manually
        }

        revalidatePath('/admin')
        return { success: true, userId: userData.user.id }

    } catch (error: any) {
        console.error("User creation failed:", error)
        throw new Error(error.message || "Failed to create user")
    }
}

export async function updateUserRole(userId: string, newRole: UserRole) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin')
}

export async function toggleUserActive(userId: string, isActive: boolean) {
    const supabase = createClient()

    const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: isActive })
        .eq('id', userId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin')
}
