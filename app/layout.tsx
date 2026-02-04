import type { Metadata } from 'next'
import { Inter, Merriweather } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import "./globals.css"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const merriweather = Merriweather({
    weight: ['300', '400', '700', '900'],
    subsets: ['latin'],
    variable: '--font-heading'
})

export const metadata: Metadata = {
    title: {
        template: '%s | Ministry of Finance',
        default: 'Ministry of Finance | Government of India',
    },
    description: "Official Financial Data & Analytics Platform",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${merriweather.variable} font-sans antialiased bg-background`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light" // Government sites usually default to light for readability
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <div className="min-h-screen flex flex-col">
                            {/* Gov Banner */}
                            <div className="bg-gov-navy-900 text-white text-xs py-1 px-4 text-center sm:text-left">
                                <div className="container mx-auto">
                                    An Official Government of India Platform
                                </div>
                            </div>

                            <MainNav />

                            <main className="flex-1 container mx-auto py-8 px-4 md:px-6 lg:px-8">
                                {children}
                            </main>

                            <footer className="border-t bg-muted/30 mt-12">
                                <div className="container mx-auto py-8 px-4 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-foreground">Ministry of Finance</span>
                                        <span>Government of India</span>
                                    </div>
                                    <div className="flex gap-6 mt-4 md:mt-0">
                                        <span>Privacy Policy</span>
                                        <span>Terms of Use</span>
                                        <span>Accessibility</span>
                                        <span>Contact</span>
                                    </div>
                                    <div className="mt-4 md:mt-0">
                                        &copy; {new Date().getFullYear()} All rights reserved.
                                    </div>
                                </div>
                            </footer>
                        </div>
                        <Toaster />
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
