import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export const metadata = { title: 'COPPA Notice — LabFlow' }

export default function CoppaPage() {
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
          <div className="flex items-center gap-3">
            <Shield className="size-8 text-primary" />
            <h1 className="text-3xl font-bold">COPPA Notice for Parents</h1>
          </div>
          <p className="text-sm text-muted-foreground">Children&apos;s Online Privacy Protection Act — Parent & Guardian Information</p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> This is a placeholder. An attorney must review and finalize this document before deploying to students under 13.
          </div>
        </div>

        <div className="space-y-8 text-foreground">
          <section className="rounded-lg border border-border bg-card p-6 space-y-3">
            <h2 className="text-lg font-semibold">What is COPPA?</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Children&apos;s Online Privacy Protection Act (COPPA) is a US federal law that requires operators of websites and online services directed at children under 13 to obtain verifiable parental consent before collecting personal information from those children.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">School Consent Exception</h2>
            <p className="text-muted-foreground leading-relaxed">
              LabFlow operates under the COPPA school consent exception. When a school signs up for LabFlow, the school acts as the parent&apos;s agent and provides consent on behalf of parents for the collection of student information necessary to provide the educational service. This means schools — not parents directly — authorize LabFlow to collect information from students under 13.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">What Information We Collect from Students Under 13</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>First and last name</li>
              <li>Email address (school-assigned)</li>
              <li>Lab work, data entries, and reflections submitted during class labs</li>
              <li>Help chat messages (when the AI Help feature is enabled by the school)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We do not collect location data, photos, or any information beyond what is needed to provide the lab management service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">How We Use This Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              Student information is used solely to provide the LabFlow educational service — enabling students to complete lab assignments, allowing teachers to monitor progress, and generating AI-assisted guidance. We do not use student information for advertising, profiling, or any commercial purpose.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Parent Rights</h2>
            <p className="text-muted-foreground leading-relaxed">As a parent or guardian, you have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Review</strong> your child&apos;s personal information collected by LabFlow</li>
              <li><strong>Request correction</strong> of inaccurate information</li>
              <li><strong>Request deletion</strong> of your child&apos;s personal information</li>
              <li><strong>Refuse further collection</strong> of your child&apos;s information</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              To exercise any of these rights, contact your child&apos;s school administrator. The school will coordinate with LabFlow to fulfill the request.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Third-Party AI Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              When the AI Help feature is enabled, student lab questions are processed by Anthropic&apos;s Claude AI. Only lab content and the student&apos;s question are sent — name and email are never transmitted to Anthropic. Schools may disable this feature entirely through the admin panel.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For COPPA-related questions or to exercise parental rights, contact:<br />
              <strong>[INSERT CONTACT EMAIL]</strong><br />
              Or contact your child&apos;s school administrator directly.
            </p>
          </section>
        </div>

        <div className="mt-12 flex gap-4 text-sm text-muted-foreground border-t border-border pt-6">
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/login" className="hover:text-foreground">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
