import { z } from "zod"

// -----------------------------------------
// TYPES
// -----------------------------------------

export type Occupation = 'farmer' | 'student' | 'employed' | 'unemployed' | 'entrepreneur' | 'retired'
export type Residence = 'urban' | 'rural'
export type Category = 'general' | 'sc' | 'st' | 'obc' | 'minority'

// Citizen Profile Schema (Input)
export const CitizenProfileSchema = z.object({
    age: z.number().min(0).max(120),
    gender: z.enum(['male', 'female', 'other']).optional(),
    residence: z.enum(['urban', 'rural']),
    state: z.string(),
    annual_income: z.number().min(0),
    occupation: z.enum(['farmer', 'student', 'employed', 'unemployed', 'entrepreneur', 'retired']),
    category: z.enum(['general', 'sc', 'st', 'obc', 'minority']).optional(),
    disability_status: z.boolean().default(false),
})

export type CitizenProfile = z.infer<typeof CitizenProfileSchema>

// Scheme Definition
export interface Scheme {
    id: string
    name: string
    ministry: string
    description: string
    benefits: string[]
    criteria: SchemeCriteria
}

// Structured Criteria for Rule Engine
export interface SchemeCriteria {
    min_age?: number
    max_age?: number
    max_income?: number
    residence_type?: Residence[]
    allowed_occupations?: Occupation[]
    gender_specific?: 'male' | 'female'
    requires_disability?: boolean
}

// -----------------------------------------
// RULE ENGINE (DETERMINISTIC)
// -----------------------------------------

export interface EligibilityResult {
    scheme_id: string
    scheme_name: string
    status: 'eligible' | 'not_eligible'
    reasons: string[] // Why match or why not match
}

export function checkEligibility(profile: CitizenProfile, schemes: Scheme[]): EligibilityResult[] {
    return schemes.map((scheme) => {
        const reasons: string[] = []
        let eligible = true

        const c = scheme.criteria

        // 1. Age Check
        if (c.min_age !== undefined && profile.age < c.min_age) {
            eligible = false
            reasons.push(`Minimum age is ${c.min_age} (You are ${profile.age})`)
        }
        if (c.max_age !== undefined && profile.age > c.max_age) {
            eligible = false
            reasons.push(`Maximum age is ${c.max_age} (You are ${profile.age})`)
        }

        // 2. Income Check
        if (c.max_income !== undefined && profile.annual_income > c.max_income) {
            eligible = false
            reasons.push(`Income exceeds limit of ₹${c.max_income.toLocaleString()}`)
        }

        // 3. Residence Check
        if (c.residence_type && !c.residence_type.includes(profile.residence)) {
            eligible = false
            reasons.push(`Scheme is for ${c.residence_type.join(' or ')} residents only`)
        }

        // 4. Occupation Check
        if (c.allowed_occupations && !c.allowed_occupations.includes(profile.occupation)) {
            eligible = false
            reasons.push(`Restricted to: ${c.allowed_occupations.join(', ')}`)
        }

        // 5. Gender Check
        if (c.gender_specific && profile.gender && profile.gender !== c.gender_specific) {
            eligible = false
            reasons.push(`Only for ${c.gender_specific} applicants`)
        }

        // 6. Disability Check
        if (c.requires_disability && !profile.disability_status) {
            eligible = false
            reasons.push(`Requires disability certificate`)
        }

        if (eligible) {
            reasons.push("You meet all basic criteria.")
        }

        return {
            scheme_id: scheme.id,
            scheme_name: scheme.name,
            status: eligible ? 'eligible' : 'not_eligible',
            reasons
        }
    })
}
