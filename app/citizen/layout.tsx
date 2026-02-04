"use client"

import Link from "next/link"

export default function CitizenLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Citizen flows usually essentially public or light-auth
    // We allow anyone to proceed, auth logic handled in components if saving specific data

    return (
        <div className="flex flex-col min-h-[calc(100vh-10rem)] bg-muted/20">
            {/* Citizen Sub-nav or Breadcrumbs could go here */}
            <div className="bg-white border-b py-2 px-4 shadow-sm">
                <div className="container mx-auto flex gap-2 text-sm text-muted-foreground">
                    <Link href="/" className="hover:underline">Home</Link>
                    <span>/</span>
                    <span className="font-medium text-foreground">Citizen Services</span>
                </div>
            </div>

            <main className="container mx-auto py-8">
                {children}
            </main>
        </div>
    )
}
