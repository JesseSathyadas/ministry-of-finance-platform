import { getActiveSchemes } from "@/lib/supabase/schemes"
import { SchemesClient } from "./schemes-client"

export const revalidate = 0

export default async function SchemesPage() {
    const schemes = await getActiveSchemes()

    return <SchemesClient schemes={schemes} />
}
