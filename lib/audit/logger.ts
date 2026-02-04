import { createClient } from "@/lib/supabase/client"
// UserRole import removed as it was unused

export type AuditAction =
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'login'
    | 'logout'
    | 'export'
    | 'config_change'
    // Custom actions for AI workflow
    | 'ai_analysis_triggered'
    | 'ai_insight_approved'
    | 'ai_insight_rejected'

interface LogEntry {
    action: AuditAction
    resource_type: string
    resource_id?: string
    details?: Record<string, unknown>
}

export const logger = {
    async log(entry: LogEntry) {
        const supabase = createClient()

        // Get current user for context
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.warn("Attempted to log audit event without authenticated user", entry)
            return
        }

        try {
            // We need to fetch the role separately or pass it in. 
            // For simplicity in this utility, we'll do a quick fetch or rely on triggers if we were server-side.
            // Since this is client-side mostly, we'll let the backend trigger handle user info where possible,
            // BUT `audit_logs` table has user_id/email/role columns. 
            // The `log_audit_action` TRIGGER in schema.sql handles generic DB ops, BUT custom app events
            // need manual insertion.

            // Let's rely on a manual insert for custom app events.
            // Note: The schema has an AFTER INSERT trigger on specific tables, 
            // but for "Analysis Run" (which might not write to DB immediately) we need manual logging.

            const { error } = await supabase.from('audit_logs').insert({
                user_id: user.id,
                user_email: user.email,
                // user_role: fetched via trigger or ignored if not critical for this specific log type 
                // (database trigger logic `log_audit_action` fetches role from user_profiles based on auth.uid())
                action: entry.action,
                resource_type: entry.resource_type,
                resource_id: entry.resource_id,
                details: entry.details,
                ip_address: null, // Client IP hard to get accurately from client-side JS without a service
                user_agent: window.navigator.userAgent
            })

            if (error) {
                console.error("Failed to write audit log:", error)
            }
        } catch (e) {
            console.error("Audit logging exception:", e)
        }
    }
}
