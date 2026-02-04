import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submitApplication } from '@/lib/supabase/applications'

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient()

        // Verify user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { data, error } = await submitApplication(body)

        if (error) {
            // Check for unique constraint violation (already applied)
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: 'You have already applied for this scheme' },
                    { status: 400 }
                )
            }

            return NextResponse.json(
                { error: error.message || 'Failed to submit application' },
                { status: 400 }
            )
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to submit application' },
            { status: 500 }
        )
    }
}
