import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllSchemes, createScheme } from '@/lib/supabase/schemes'

export async function GET() {
    try {
        const schemes = await getAllSchemes()
        return NextResponse.json(schemes)
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch schemes' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
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
        const { data, error } = await createScheme(body)

        if (error) {
            return NextResponse.json(
                { error: error.message || 'Failed to create scheme' },
                { status: 400 }
            )
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to create scheme' },
            { status: 500 }
        )
    }
}
