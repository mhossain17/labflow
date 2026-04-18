import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">LabFlow</h1>
          <p className="text-sm text-muted-foreground mt-1">Classroom Lab Management</p>
        </div>
        {children}
      </div>
      <footer className="mt-8 flex gap-4 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        <Link href="/coppa" className="hover:text-foreground transition-colors">COPPA Notice</Link>
      </footer>
    </div>
  )
}
