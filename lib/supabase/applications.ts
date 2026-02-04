import { createClient } from '@/lib/supabase/server'
import type {
    SchemeApplication,
    ApplicationWithDetails,
    SubmitApplicationInput,
    ReviewApplicationInput,
    ApplicationFilters
} from '@/lib/types/schemes'

/**
 * Submit a new application (citizen only)
 */
export async function submitApplication(input: SubmitApplicationInput): Promise<{ data: SchemeApplication | null; error: any }> {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { data: null, error: { message: 'Not authenticated' } }
    }

    const { data, error } = await supabase
        .from('scheme_applications')
        .insert({
            scheme_id: input.scheme_id,
            citizen_id: user.id,
            application_data: input.application_data,
            status: 'pending',
            submitted_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        console.error('Error submitting application:', error)
        return { data: null, error }
    }

    return { data, error: null }
}

/**
 * Get applications for current user (citizen view)
 */
export async function getMyApplications(): Promise<ApplicationWithDetails[]> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from('scheme_applications')
        .select(`
            *,
            scheme:schemes (*),
            reviewer:user_profiles!scheme_applications_reviewed_by_fkey (
                id,
                email,
                full_name,
                role
            )
        `)
        .eq('citizen_id', user.id)
        .order('submitted_at', { ascending: false })

    if (error) {
        console.error('Error fetching my applications:', error)
        return []
    }

    return data || []
}

/**
 * Get all applications (analyst/admin view)
 */
export async function getAllApplications(filters?: ApplicationFilters): Promise<ApplicationWithDetails[]> {
    const supabase = createClient()

    let query = supabase
        .from('scheme_applications')
        .select(`
            *,
            scheme:schemes (*),
            citizen:user_profiles!scheme_applications_citizen_id_fkey (
                id,
                email,
                full_name
            ),
            reviewer:user_profiles!scheme_applications_reviewed_by_fkey (
                id,
                email,
                full_name,
                role
            )
        `)

    // Apply filters
    if (filters?.scheme_id) {
        query = query.eq('scheme_id', filters.scheme_id)
    }

    if (filters?.status) {
        query = query.eq('status', filters.status)
    }

    if (filters?.from_date) {
        query = query.gte('submitted_at', filters.from_date)
    }

    if (filters?.to_date) {
        query = query.lte('submitted_at', filters.to_date)
    }

    query = query.order('submitted_at', { ascending: false })

    const { data, error } = await query

    if (error) {
        console.error('Error fetching all applications:', error)
        return []
    }

    return data || []
}

/**
 * Get a single application by ID
 */
export async function getApplicationById(id: string): Promise<ApplicationWithDetails | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('scheme_applications')
        .select(`
            *,
            scheme:schemes (*),
            citizen:user_profiles!scheme_applications_citizen_id_fkey (
                id,
                email,
                full_name
            ),
            reviewer:user_profiles!scheme_applications_reviewed_by_fkey (
                id,
                email,
                full_name,
                role
            )
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching application:', error)
        return null
    }

    return data
}

/**
 * Review an application (analyst/admin only)
 */
export async function reviewApplication(input: ReviewApplicationInput): Promise<{ success: boolean; error: any }> {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: { message: 'Not authenticated' } }
    }

    const { error } = await supabase
        .from('scheme_applications')
        .update({
            status: input.status,
            review_notes: input.review_notes,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', input.application_id)

    if (error) {
        console.error('Error reviewing application:', error)
        return { success: false, error }
    }

    return { success: true, error: null }
}

/**
 * Get application statistics (admin dashboard)
 */
export async function getApplicationStats(): Promise<{
    total: number
    pending: number
    under_review: number
    approved: number
    rejected: number
}> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('scheme_applications')
        .select('status')

    if (error) {
        console.error('Error fetching application stats:', error)
        return { total: 0, pending: 0, under_review: 0, approved: 0, rejected: 0 }
    }

    const stats = {
        total: data.length,
        pending: data.filter(a => a.status === 'pending').length,
        under_review: data.filter(a => a.status === 'under_review').length,
        approved: data.filter(a => a.status === 'approved').length,
        rejected: data.filter(a => a.status === 'rejected').length
    }

    return stats
}

/**
 * Check if user has already applied for a scheme
 */
export async function hasAppliedForScheme(schemeId: string): Promise<boolean> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return false
    }

    const { data, error } = await supabase
        .from('scheme_applications')
        .select('id')
        .eq('scheme_id', schemeId)
        .eq('citizen_id', user.id)
        .single()

    return !!data && !error
}
