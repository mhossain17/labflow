import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Terms of Service — LabFlow' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <div className="space-y-2 mb-10">
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> This is a placeholder. An attorney must review and finalize this document before deploying to students.
          </div>
        </div>

        <div className="space-y-8 text-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using LabFlow, you agree to be bound by these Terms of Service and our Privacy Policy. If you are accessing LabFlow on behalf of a school or organization, you represent that you have authority to bind that organization to these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">2. Educational Use Only</h2>
            <p className="text-muted-foreground leading-relaxed">
              LabFlow is designed exclusively for educational purposes in K-12 settings. Users may not use the platform for commercial purposes, to collect data for non-educational purposes, or in any manner that violates applicable laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">3. School Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              Schools and administrators are responsible for: (a) obtaining any necessary parental consents; (b) ensuring student use complies with FERPA and applicable state laws; (c) managing user accounts and access; (d) notifying LabFlow of any data breach or unauthorized access.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">4. AI Features</h2>
            <p className="text-muted-foreground leading-relaxed">
              LabFlow uses Anthropic&apos;s Claude AI for certain features (lab generation, student help). Schools must review and accept Anthropic&apos;s terms of service before enabling these features. AI features can be disabled per organization. We do not guarantee accuracy of AI-generated content and teachers should review all AI output before use.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              Lab content created by teachers remains the property of the teacher or their institution. Student work remains the property of the student. LabFlow retains rights to the platform software and infrastructure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              LabFlow is provided &ldquo;as is.&rdquo; We are not liable for any indirect, incidental, or consequential damages arising from use of the platform. Our total liability shall not exceed the fees paid by your organization in the preceding 12 months.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">7. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              Either party may terminate service with 30 days written notice. Upon termination, we will provide a data export and delete all student data within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">8. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about these terms: <strong>[INSERT CONTACT EMAIL]</strong>
            </p>
          </section>
        </div>

        <div className="mt-12 flex gap-4 text-sm text-muted-foreground border-t border-border pt-6">
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/coppa" className="hover:text-foreground">COPPA Notice</Link>
          <Link href="/login" className="hover:text-foreground">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
