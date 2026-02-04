import { createClient } from '@/lib/supabase/server'
import type { Scheme, SchemeWithStats, CreateSchemeInput, UpdateSchemeInput } from '@/lib/types/schemes'

/**
 * Get all active schemes (public access)
 */
export async function getActiveSchemes(): Promise<Scheme[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('schemes')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching active schemes:', error)
        return []
    }

    return data || []
}

/**
 * Get all schemes (admin only - includes drafts and inactive)
 */
export async function getAllSchemes(): Promise<SchemeWithStats[]> {
    const supabase = createClient()

    // 1. Fetch schemes
    const { data: schemes, error: schemesError } = await supabase
        .from('schemes')
        .select(`
            *,
            scheme_applications (count)
        `)
        .order('created_at', { ascending: false })

    if (schemesError) {
        console.error('Error fetching all schemes:', schemesError)
        return []
    }

    // 2. Fetch ALL relevant application statuses in one go to avoid N+1 slow loading
    const { data: allStatuses } = await supabase
        .from('scheme_applications')
        .select('scheme_id, status')

    // 3. Map memory for speed
    const schemesWithStats: SchemeWithStats[] = (schemes || []).map((scheme: any) => {
        const stats = allStatuses?.filter(s => s.scheme_id === scheme.id) || []

        return {
            ...scheme,
            application_count: scheme.scheme_applications?.[0]?.count || 0,
            pending_count: stats.filter(s => s.status === 'pending').length,
            under_review_count: stats.filter(s => s.status === 'under_review').length,
            forwarded_count: stats.filter(s => s.status === 'forwarded_to_admin').length,
            approved_count: stats.filter(s => s.status === 'approved').length
        }
    })

    return schemesWithStats
}

/**
 * Get a single scheme by ID
 */
export async function getSchemeById(id: string): Promise<Scheme | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('schemes')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching scheme:', error)
        return null
    }

    return data
}

/**
 * Create a new scheme (admin only)
 */
export async function createScheme(input: CreateSchemeInput): Promise<{ data: Scheme | null; error: any }> {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
        .from('schemes')
        .insert({
            ...input,
            created_by: user?.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating scheme:', error)
        return { data: null, error }
    }

    return { data, error: null }
}

/**
 * Update an existing scheme (admin only)
 */
export async function updateScheme(input: UpdateSchemeInput): Promise<{ data: Scheme | null; error: any }> {
    const supabase = createClient()

    const { id, ...updates } = input

    const { data, error } = await supabase
        .from('schemes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating scheme:', error)
        return { data: null, error }
    }

    return { data, error: null }
}

/**
 * Toggle scheme status (admin only)
 */
export async function toggleSchemeStatus(id: string, status: 'active' | 'inactive' | 'draft'): Promise<{ success: boolean; error: any }> {
    const supabase = createClient()

    const { error } = await supabase
        .from('schemes')
        .update({ status })
        .eq('id', id)

    if (error) {
        console.error('Error toggling scheme status:', error)
        return { success: false, error }
    }

    return { success: true, error: null }
}

/**
 * Delete a scheme (super admin only)
 */
export async function deleteScheme(id: string): Promise<{ success: boolean; error: any }> {
    const supabase = createClient()

    const { error } = await supabase
        .from('schemes')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting scheme:', error)
        return { success: false, error }
    }

    return { success: true, error: null }
}
