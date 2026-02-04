import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reviewApplication } from '@/lib/supabase/applications'

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient()

        // Verify user is analyst or admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || !['analyst', 'admin', 'super_admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const newStatus = body.status

        // RBAC Workflow Enforcement
        if (profile.role === 'analyst') {
            if (newStatus === 'approved') {
                return NextResponse.json(
                    { error: 'Analysts cannot grant final approval. Please select "Forward to Admin".' },
                    { status: 403 }
                )
            }
            if (!['under_review', 'rejected', 'forwarded_to_admin'].includes(newStatus)) {
                return NextResponse.json(
                    { error: 'Invalid status transition for Analyst. Can only review, reject, or forward.' },
                    { status: 400 }
                )
            }
        }

        if (profile.role === 'admin' || profile.role === 'super_admin') {
            // Admins can do anything, but they usually approve forwarded ones
        }

        const { success, error } = await reviewApplication({
            application_id: params.id,
            status: newStatus,
            review_notes: body.review_notes
        })

        if (error) {
            return NextResponse.json(
                { error: error.message || 'Failed to review application' },
                { status: 400 }
            )
        }

        return NextResponse.json({ success })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to review application' },
            { status: 500 }
        )
    }
}
