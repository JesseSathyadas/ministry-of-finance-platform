// ============================================
// SCHEME & APPLICATION TYPES
// ============================================

export type SchemeStatus = 'draft' | 'active' | 'inactive'
export type ApplicationStatus = 'pending' | 'under_review' | 'forwarded_to_admin' | 'approved' | 'rejected'

export interface Scheme {
    id: string
    name: string
    ministry: string
    description: string
    benefits: string[]
    eligibility_criteria: EligibilityCriteria
    benefit_amount: number | null
    status: SchemeStatus
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface EligibilityCriteria {
    min_age?: number
    max_age?: number
    max_income?: number
    allowed_occupations?: string[]
    residence_type?: string[]
    [key: string]: any // Allow additional custom criteria
}

export interface SchemeApplication {
    id: string
    scheme_id: string
    citizen_id: string
    application_data: ApplicationData
    status: ApplicationStatus
    reviewed_by: string | null
    review_notes: string | null
    submitted_at: string
    reviewed_at: string | null
    created_at: string
    updated_at: string
}

export interface ApplicationData {
    age: number
    occupation: string
    annual_income: number
    state: string
    residence: 'urban' | 'rural'
    disability_status?: boolean
    [key: string]: any // Allow additional fields
}

// Extended types with relations for UI
export interface SchemeWithStats extends Scheme {
    application_count?: number
    pending_count?: number
    approved_count?: number
}

export interface ApplicationWithDetails extends SchemeApplication {
    scheme?: Scheme
    citizen?: {
        id: string
        email: string
        full_name?: string
    }
    reviewer?: {
        id: string
        email: string
        full_name?: string
        role: string
    }
}

// Form types
export interface CreateSchemeInput {
    name: string
    ministry: string
    description: string
    benefits: string[]
    eligibility_criteria: EligibilityCriteria
    benefit_amount: number | null
    status: SchemeStatus
}

export interface UpdateSchemeInput extends Partial<CreateSchemeInput> {
    id: string
}

export interface SubmitApplicationInput {
    scheme_id: string
    application_data: ApplicationData
}

export interface ReviewApplicationInput {
    application_id: string
    status: 'approved' | 'rejected' | 'under_review'
    review_notes: string
}

// Filter types
export interface ApplicationFilters {
    scheme_id?: string
    status?: ApplicationStatus
    from_date?: string
    to_date?: string
    search?: string
}
