import { createClient } from "@/lib/supabase/server"
import { ApplicationReview } from "@/components/analyst/application-review"
import { getAllApplications } from "@/lib/supabase/applications"
import { getActiveSchemes } from "@/lib/supabase/schemes"

export const revalidate = 0

async function getApplicationData() {
    const applications = await getAllApplications()
    const schemes = await getActiveSchemes()

    return {
        applications,
        schemes: schemes.map(s => ({ id: s.id, name: s.name }))
    }
}

export default async function AnalystApplicationsPage() {
    const data = await getApplicationData()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Default to 'analyst' if not found, though middleware should catch this
    let userRole = 'analyst'
    if (user) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        if (profile) userRole = profile.role
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div>
                <h1 className="text-3xl font-heading font-bold text-gov-navy-900">Application Management</h1>
                <p className="text-muted-foreground mt-1">Review and process citizen applications for government schemes</p>
            </div>

            <ApplicationReview
                applications={data.applications}
                schemes={data.schemes}
                userRole={userRole}
            />
        </div>
    )
}
