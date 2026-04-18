import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Privacy Policy — LabFlow' }

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> This is a placeholder privacy policy. Your organization must have a licensed attorney review and finalize this document before deploying to students.
          </div>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              LabFlow (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is a classroom lab management platform designed for educational institutions. This Privacy Policy explains how we collect, use, disclose, and safeguard student and educator information in compliance with the Family Educational Rights and Privacy Act (FERPA), the Children's Online Privacy Protection Act (COPPA), and the Student Online Personal Information Protection Act (SOPIPA).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">We collect the following information to provide our educational services:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Name and email address (provided at account creation)</li>
              <li>Role within the institution (teacher, student, administrator)</li>
              <li>Lab work, data entries, and reflection responses submitted during labs</li>
              <li>Help chat conversations (processed by Anthropic&apos;s Claude AI — see Section 5)</li>
              <li>Class enrollment and assignment records</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">3. FERPA Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              LabFlow acts as a &ldquo;school official&rdquo; under FERPA with a legitimate educational interest in student education records. We do not sell, share, or disclose student education records to third parties except as permitted by FERPA. Students and parents have the right to inspect, review, and request corrections to education records. To exercise these rights, contact your school administrator.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">4. COPPA — Children Under 13</h2>
            <p className="text-muted-foreground leading-relaxed">
              LabFlow is intended for use in K-12 educational settings under the oversight of schools. If your institution enrolls students under the age of 13, the school provides consent on behalf of parents pursuant to COPPA&apos;s school consent exception. We do not collect personal information from children under 13 beyond what is necessary to provide educational services. Parents may request access to or deletion of their child&apos;s data by contacting the school administrator.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">5. Third-Party AI Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              When students use the AI Help feature, their lab context and questions are processed by <strong>Anthropic&apos;s Claude API</strong>. We do not send personally identifiable information (name, email) to Anthropic — only the lab step content and the student&apos;s question. Schools should review Anthropic&apos;s privacy policy and execute a Data Processing Agreement before enabling this feature. The AI Help feature can be disabled per organization by a school administrator.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">6. Data Retention & Deletion</h2>
            <p className="text-muted-foreground leading-relaxed">
              Student data is retained for the duration of the school&apos;s subscription. School administrators may request deletion of individual student records at any time through the Admin Panel. Upon school request or contract termination, all student data is deleted within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">7. Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures including row-level security, role-based access controls, encrypted data transmission (TLS), and audit logging of access to student records. We store data using Supabase (PostgreSQL) hosted in secure data centers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">8. SOPIPA Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell student information, use it for targeted advertising, or build profiles for non-educational purposes. Student data is used solely to provide the LabFlow educational service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy questions, FERPA requests, or data deletion requests, contact your school administrator or reach us at: <strong>[INSERT CONTACT EMAIL]</strong>
            </p>
          </section>
        </div>

        <div className="mt-12 flex gap-4 text-sm text-muted-foreground border-t border-border pt-6">
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/coppa" className="hover:text-foreground">COPPA Notice</Link>
          <Link href="/login" className="hover:text-foreground">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
