import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateScheme, deleteScheme } from '@/lib/supabase/schemes'

export async function PUT(
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
        const { data, error } = await updateScheme({ id: params.id, ...body })

        if (error) {
            return NextResponse.json(
                { error: error.message || 'Failed to update scheme' },
                { status: 400 }
            )
        }

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to update scheme' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient()

        // Verify user is super_admin
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
            return NextResponse.json({ error: 'Forbidden - Admins only' }, { status: 403 })
        }

        const { success, error } = await deleteScheme(params.id)

        if (error) {
            return NextResponse.json(
                { error: error.message || 'Failed to delete scheme' },
                { status: 400 }
            )
        }

        return NextResponse.json({ success })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to delete scheme' },
            { status: 500 }
        )
    }
}
