import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import { Toaster } from 'sonner'
import { ImpersonationBanner } from '@/components/shared/ImpersonationBanner'

export const metadata: Metadata = {
  title: 'LabFlow',
  description: 'Classroom Lab Management Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ImpersonationBanner />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
