import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import ClientLayout from "./client-layout"

// Primary corporate font: Poppins
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
})

const metadata: Metadata = {
  title: "GoPLNR.com - Interior Designer Management System",
  description: "Complete CRM solution for interior designers and architects",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
}

export { metadata }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${poppins.variable} ${GeistMono.variable}`}>
        <ClientLayout>
          <Suspense fallback={null}>{children}</Suspense>
        </ClientLayout>
        <Analytics />
      </body>
    </html>
  )
}
