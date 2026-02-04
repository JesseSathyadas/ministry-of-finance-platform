"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle2, Search, Filter, FileText } from "lucide-react"
import type { Scheme } from "@/lib/types/schemes"
import { useRouter } from "next/navigation"

interface SchemesClientProps {
    schemes: Scheme[]
}

type Occupation = "employed" | "unemployed" | "student" | "farmer" | "retired"
type Residence = "urban" | "rural"

interface CitizenProfile {
    age: number
    state: string
    residence: Residence
    annual_income: number
    occupation: Occupation
    disability_status: boolean
}

export function SchemesClient({ schemes }: SchemesClientProps) {
    const router = useRouter()
    const [profile, setProfile] = useState<CitizenProfile>({
        age: 30,
        state: "Delhi",
        residence: "urban",
        annual_income: 300000,
        occupation: "employed",
        disability_status: false
    })

    const [results, setResults] = useState<{ id: string, status: string, reasons: string[] }[]>([])
    const [hasChecked, setHasChecked] = useState(false)
    const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null)
    const [isApplyOpen, setIsApplyOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [bankDetails, setBankDetails] = useState({
        account_name: "",
        account_number: "",
        ifsc_code: "",
        bank_name: ""
    })

    // Check eligibility
    const handleCheck = () => {
        const eligibilityResults = schemes.map(scheme => {
            const criteria = scheme.eligibility_criteria
            const reasons: string[] = []
            let eligible = true

            // Check age
            if (criteria.min_age && profile.age < criteria.min_age) {
                eligible = false
                reasons.push(`Minimum age required: ${criteria.min_age}`)
            }
            if (criteria.max_age && profile.age > criteria.max_age) {
                eligible = false
                reasons.push(`Maximum age limit: ${criteria.max_age}`)
            }

            // Check income
            if (criteria.max_income && profile.annual_income > criteria.max_income) {
                eligible = false
                reasons.push(`Income exceeds limit of ₹${criteria.max_income.toLocaleString()}`)
            }

            // Check occupation
            if (criteria.allowed_occupations && !criteria.allowed_occupations.includes(profile.occupation)) {
                eligible = false
                reasons.push(`Occupation must be: ${criteria.allowed_occupations.join(', ')}`)
            }

            // Check residence
            if (criteria.residence_type && !criteria.residence_type.includes(profile.residence)) {
                eligible = false
                reasons.push(`Residence must be: ${criteria.residence_type.join(', ')}`)
            }

            if (eligible) {
                reasons.push('You meet all eligibility criteria')
            }

            return {
                id: scheme.id,
                status: eligible ? 'eligible' : 'not_eligible',
                reasons
            }
        })

        setResults(eligibilityResults)
        setHasChecked(true)
    }

    const getSchemeStatus = (id: string) => {
        if (!hasChecked) return null
        return results.find(r => r.id === id)
    }

    const handleApply = (scheme: Scheme) => {
        setSelectedScheme(scheme)
        setIsApplyOpen(true)
    }

    const handleSubmitApplication = async () => {
        if (!selectedScheme) return

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scheme_id: selectedScheme.id,
                    application_data: {
                        age: profile.age,
                        occupation: profile.occupation,
                        annual_income: profile.annual_income,
                        state: profile.state,
                        residence: profile.residence,
                        disability_status: profile.disability_status,
                        bank_details: bankDetails // Include bank details
                    }
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to submit application')
            }

            alert('Application submitted successfully! You can track its status in "My Applications".')
            setIsApplyOpen(false)
            setSelectedScheme(null)
        } catch (error: any) {
            alert(error.message || 'An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const [detailScheme, setDetailScheme] = useState<Scheme | null>(null) // For View Details dialog

    const handleViewDetails = (scheme: Scheme) => {
        setDetailScheme(scheme)
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-gov-navy-900">Government Schemes</h1>
                    <p className="text-muted-foreground mt-1">Discover, check eligibility, and apply for verified government programs.</p>
                </div>
                <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified Programs
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* LEFT COLUMN: FILTERS / ELIGIBILITY FORM */}
                <Card className="lg:col-span-1 h-fit sticky top-24">
                    <CardHeader>
                        <CardTitle className="text-lg">Check Eligibility</CardTitle>
                        <CardDescription>Enter details to find matching schemes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Age</Label>
                            <Input
                                type="number"
                                value={profile.age}
                                onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Occupation</Label>
                            <Select
                                value={profile.occupation}
                                onValueChange={(v) => setProfile({ ...profile, occupation: v as Occupation })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="employed">Employed</SelectItem>
                                    <SelectItem value="unemployed">Unemployed</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="farmer">Farmer</SelectItem>
                                    <SelectItem value="retired">Retired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Annual Income (₹)</Label>
                            <Input
                                type="number"
                                value={profile.annual_income}
                                onChange={(e) => setProfile({ ...profile, annual_income: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Residence</Label>
                            <Select
                                value={profile.residence}
                                onValueChange={(v) => setProfile({ ...profile, residence: v as Residence })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="urban">Urban</SelectItem>
                                    <SelectItem value="rural">Rural</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="terms"
                                checked={true}
                                disabled
                            />
                            <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
                                I consent to processing this data for eligibility checking only. No data is shared.
                            </label>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-gov-blue hover:bg-gov-blue-light" onClick={handleCheck}>
                            Check Eligibility
                        </Button>
                    </CardFooter>
                </Card>

                {/* RIGHT COLUMN: SCHEMES LIST */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search schemes by name..." className="pl-10" />
                        </div>
                        <Button variant="outline">
                            <Filter className="h-4 w-4 mr-2" /> Filter
                        </Button>
                    </div>

                    {schemes.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No active schemes available at the moment.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {schemes.map((scheme) => {
                                const result = getSchemeStatus(scheme.id)
                                const isEligible = result?.status === 'eligible'
                                const isNotEligible = result?.status === 'not_eligible'

                                return (
                                    <Card key={scheme.id} className={`transition-all ${isEligible ? 'border-green-500 bg-green-50/10' : ''} ${isNotEligible ? 'opacity-70' : ''}`}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-xs font-semibold text-gov-teal uppercase tracking-wider mb-1">
                                                        {scheme.ministry}
                                                    </div>
                                                    <CardTitle className="text-xl text-gov-navy-900">{scheme.name}</CardTitle>
                                                </div>
                                                {hasChecked && (
                                                    <Badge variant={isEligible ? "success" : "destructive"}>
                                                        {isEligible ? "Eligible" : "Not Eligible"}
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground mb-4 line-clamp-2">{scheme.description}</p>

                                            {/* Brief Benefits Preview */}
                                            <div className="flex gap-2 flex-wrap mb-4">
                                                {scheme.benefits.slice(0, 2).map((b, i) => (
                                                    <Badge key={i} variant="secondary" className="font-normal">{b}</Badge>
                                                ))}
                                                {scheme.benefits.length > 2 && <Badge variant="outline">+{scheme.benefits.length - 2} more</Badge>}
                                            </div>

                                            {hasChecked && result && result.reasons.length > 0 && (
                                                <div className={`mt-2 p-3 rounded text-sm ${isEligible ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                                    <strong>Status:</strong> {isEligible ? 'You are eligible!' : 'Check requirements in details.'}
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="flex gap-3 justify-end border-t pt-4">
                                            <Button variant="outline" onClick={() => handleViewDetails(scheme)}>
                                                View Details
                                            </Button>
                                            {isEligible && (
                                                <Button className="bg-gov-blue" onClick={() => handleApply(scheme)}>
                                                    Apply Now
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Scheme Details Dialog (New) */}
            <Dialog open={!!detailScheme} onOpenChange={(open) => !open && setDetailScheme(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {detailScheme && (
                        <>
                            <DialogHeader>
                                <div className="text-xs font-semibold text-gov-teal uppercase tracking-wider mb-1">
                                    {detailScheme.ministry}
                                </div>
                                <DialogTitle className="text-2xl">{detailScheme.name}</DialogTitle>
                                <DialogDescription className="text-base mt-2">
                                    {detailScheme.description}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-4">
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">Key Benefits</h4>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        {detailScheme.benefits.map((benefit, i) => (
                                            <li key={i}>{benefit}</li>
                                        ))}
                                    </ul>
                                </div>

                                {detailScheme.benefit_amount && (
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                        <h4 className="font-semibold text-green-900 mb-1">Financial Assistance</h4>
                                        <p className="text-2xl font-bold text-green-700">₹{detailScheme.benefit_amount.toLocaleString()}</p>
                                        <p className="text-sm text-green-800">Provided directly to bank account</p>
                                    </div>
                                )}

                                <div>
                                    <h4 className="font-semibold text-lg mb-2">Eligibility Criteria</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {detailScheme.eligibility_criteria.min_age && (
                                            <div className="bg-muted p-3 rounded">
                                                <span className="text-muted-foreground block text-xs">Minimum Age</span>
                                                <span className="font-medium">{detailScheme.eligibility_criteria.min_age} Years</span>
                                            </div>
                                        )}
                                        {detailScheme.eligibility_criteria.max_income && (
                                            <div className="bg-muted p-3 rounded">
                                                <span className="text-muted-foreground block text-xs">Income Limit</span>
                                                <span className="font-medium">Up to ₹{detailScheme.eligibility_criteria.max_income.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {detailScheme.eligibility_criteria.residence_type && (
                                            <div className="bg-muted p-3 rounded">
                                                <span className="text-muted-foreground block text-xs">Residence</span>
                                                <span className="font-medium capitalize">{detailScheme.eligibility_criteria.residence_type.join(', ')}</span>
                                            </div>
                                        )}
                                        {detailScheme.eligibility_criteria.allowed_occupations && (
                                            <div className="bg-muted p-3 rounded">
                                                <span className="text-muted-foreground block text-xs">Occupation</span>
                                                <span className="font-medium capitalize">{detailScheme.eligibility_criteria.allowed_occupations.join(', ')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDetailScheme(null)}>Close</Button>
                                {/* Only show apply here if eligible, reusing logic roughly or just relying on main card */}
                                {hasChecked && getSchemeStatus(detailScheme.id)?.status === 'eligible' && (
                                    <Button className="bg-gov-blue" onClick={() => {
                                        setDetailScheme(null)
                                        handleApply(detailScheme)
                                    }}>
                                        Apply From Here
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Application Dialog */}
            <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Apply for {selectedScheme?.name}</DialogTitle>
                        <DialogDescription>
                            Submit your application for this scheme
                        </DialogDescription>
                    </DialogHeader>

                    {selectedScheme && (
                        <div className="space-y-6">
                            <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm font-semibold mb-2">Your Profile Data:</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p><span className="text-muted-foreground">Age:</span> {profile.age}</p>
                                    <p><span className="text-muted-foreground">Occupation:</span> {profile.occupation}</p>
                                    <p><span className="text-muted-foreground">Income:</span> ₹{profile.annual_income.toLocaleString()}</p>
                                    <p><span className="text-muted-foreground">State:</span> {profile.state}</p>
                                </div>
                            </div>

                            <div className="space-y-4 border-t pt-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Bank Account Details for Subsidy
                                </h4>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label>Account Holder Name</Label>
                                        <Input
                                            placeholder="As per bank records"
                                            value={bankDetails.account_name}
                                            onChange={(e) => setBankDetails({ ...bankDetails, account_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Account Number</Label>
                                            <Input
                                                type="password"
                                                placeholder="XXXXXXXXXXXX"
                                                value={bankDetails.account_number}
                                                onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>IFSC Code</Label>
                                            <Input
                                                placeholder="SBIN000XXXX"
                                                className="uppercase"
                                                maxLength={11}
                                                value={bankDetails.ifsc_code}
                                                onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bank Name</Label>
                                        <Input
                                            placeholder="e.g. State Bank of India"
                                            value={bankDetails.bank_name}
                                            onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground bg-blue-50 p-3 rounded text-blue-800">
                                <strong>Note:</strong> The subsidy amount (if applicable) will be transferred directly to this bank account via DBT (Direct Benefit Transfer) after approval.
                            </p>
                        </div>
                    )}

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsApplyOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitApplication}
                            disabled={isSubmitting || !bankDetails.account_number || !bankDetails.ifsc_code}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Authorization'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
