import { getMyApplications } from "@/lib/supabase/applications"
import { MyApplicationsClient } from "./applications-client"

export const revalidate = 0

export default async function MyApplicationsPage() {
    const applications = await getMyApplications()

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div>
                <h1 className="text-3xl font-heading font-bold text-gov-navy-900">My Applications</h1>
                <p className="text-muted-foreground mt-1">Track the status of your scheme applications</p>
            </div>

            <MyApplicationsClient applications={applications} />
        </div>
    )
}
