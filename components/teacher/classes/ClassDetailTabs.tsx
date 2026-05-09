'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users, FlaskConical } from 'lucide-react'

type Tab = 'students' | 'labs'

interface ClassDetailTabsProps {
  activeTab: Tab
  classId: string
}

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'students', label: 'Students', icon: <Users className="size-4" /> },
  { key: 'labs', label: 'Labs', icon: <FlaskConical className="size-4" /> },
]

export function ClassDetailTabs({ activeTab, classId }: ClassDetailTabsProps) {
  const router = useRouter()

  function setTab(tab: Tab) {
    const params = new URLSearchParams()
    if (tab !== 'students') params.set('tab', tab)
    const query = params.toString()
    router.push(`/teacher/classes/${classId}${query ? `?${query}` : ''}`)
  }

  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => setTab(tab.key)}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === tab.key
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
