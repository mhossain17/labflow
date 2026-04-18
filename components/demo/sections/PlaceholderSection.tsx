'use client'

import { motion } from 'framer-motion'
import { Construction } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PlaceholderSectionProps {
  sectionNumber: string
  title: string
  description: string
}

export function PlaceholderSection({
  sectionNumber,
  title,
  description,
}: PlaceholderSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-3xl border border-dashed border-border bg-card/70 p-6"
    >
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Section {sectionNumber}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="size-4 text-primary" />
              Demo Section Scaffolded
            </CardTitle>
            <CardDescription>
              Architecture is in place. This section is queued for full interactive animation in
              the next build phase.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Use the timeline or Next Step controls to continue the presentation flow.
          </CardContent>
        </Card>
      </div>
    </motion.section>
  )
}
