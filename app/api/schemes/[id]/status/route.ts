import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toggleSchemeStatus } from '@/lib/supabase/schemes'

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient()

        // Verify user is admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { success, error } = await toggleSchemeStatus(params.id, body.status)

        if (error) {
            return NextResponse.json(
                { error: error.message || 'Failed to update status' },
                { status: 400 }
            )
        }

        return NextResponse.json({ success })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to update status' },
            { status: 500 }
        )
    }
}
