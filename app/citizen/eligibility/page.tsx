"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, FileCheck } from "lucide-react"

export default function EligibilityWizardPage() {
    const router = useRouter()

    // Simplified state for the wizard
    const [age, setAge] = useState("")
    const [state, setState] = useState("Delhi")
    const [occupation, setOccupation] = useState("")

    const handleSubmit = () => {
        // In a real app, we would pass these as query params to the schemes page
        // or save to context. For now, we redirect to the main discovery page.
        router.push(`/citizen/schemes?age=${age}&occupation=${occupation}`)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="text-center space-y-4">
                <div className="mx-auto h-12 w-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                    <FileCheck className="h-6 w-6" />
                </div>
                <h1 className="text-3xl font-heading font-bold text-gov-navy-900">Check Your Eligibility</h1>
                <p className="text-lg text-muted-foreground">
                    Answer a few questions to find government schemes you qualify for.
                    <br />
                    <span className="text-sm">Your data is not stored and is used only for this check.</span>
                </p>
            </div>

            <Card className="border-t-4 border-t-gov-blue shadow-gov">
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>All fields are optional, but help improve accuracy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="age">Age (Years)</Label>
                            <Input
                                id="age"
                                type="number"
                                placeholder="e.g. 35"
                                value={age}
                                onChange={e => setAge(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State / Territory</Label>
                            <Select value={state} onValueChange={setState}>
                                <SelectTrigger id="state">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Delhi">Delhi</SelectItem>
                                    <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                                    <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                                    <SelectItem value="Karnataka">Karnataka</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="occupation">Occupation</Label>
                        <Select value={occupation} onValueChange={setOccupation}>
                            <SelectTrigger id="occupation">
                                <SelectValue placeholder="Select occupation..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="farmer">Farmer</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="employed">Salaried Employee</SelectItem>
                                <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                                <SelectItem value="unemployed">Unemployed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg flex items-start gap-3">
                        <Checkbox id="consent" className="mt-1" />
                        <div className="space-y-1">
                            <Label htmlFor="consent" className="font-semibold">Privacy Consent</Label>
                            <p className="text-xs text-muted-foreground">
                                I verify that I am entering my own details or details of a family member
                                for the purpose of finding eligible government schemes.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between bg-muted/10 p-6">
                    <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                    <Button className="bg-gov-blue hover:bg-gov-blue-light" onClick={handleSubmit}>
                        Find Schemes <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
