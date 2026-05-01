import type { CSSProperties, ReactNode } from 'react'
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { DURATION_FRAMES, FPS, type ReelAspect } from '../config'
import { SCENE_SPECS } from '../data/sceneSpec'
import type { SceneWithFrames } from '../types'

interface DemoReelProps {
  aspect: ReelAspect
  withVoiceover?: boolean
}

interface CursorState {
  xPercent: number
  yPercent: number
  click: boolean
  visible: boolean
}

const BG_GRADIENT =
  'radial-gradient(circle at 10% 0%, rgba(196, 33, 33, 0.22), transparent 36%), radial-gradient(circle at 90% 10%, rgba(16, 66, 188, 0.16), transparent 36%), linear-gradient(180deg, #06090f 0%, #0a1220 45%, #06090f 100%)'

const PROBLEM_ROWS = [
  { name: 'Avery J.', status: 'Waiting', detail: 'Step prompt repeated' },
  { name: 'Riley M.', status: 'Idle', detail: 'Unsure where to continue' },
  { name: 'Noah P.', status: 'Working', detail: 'No visibility for teacher' },
  { name: 'Emma C.', status: 'Waiting', detail: 'Needs instruction check-in' },
  { name: 'Liam B.', status: 'Idle', detail: 'Paused on data entry' },
  { name: 'Sofia C.', status: 'Working', detail: 'Progress not surfaced live' },
]

const MONITOR_ROWS = [
  { name: 'Avery J.', step: 3, status: 'On Track' },
  { name: 'Riley M.', step: 3, status: 'Stuck' },
  { name: 'Noah P.', step: 4, status: 'On Track' },
  { name: 'Emma C.', step: 3, status: 'Stuck' },
  { name: 'Liam B.', step: 3, status: 'Stuck' },
  { name: 'Sofia C.', step: 4, status: 'Finished Step' },
  { name: 'Maya T.', step: 3, status: 'Stuck' },
  { name: 'Ethan R.', step: 4, status: 'On Track' },
]

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function mix(from: number, to: number, progress: number): number {
  return from + (to - from) * clamp01(progress)
}

function between(progress: number, start: number, end: number): boolean {
  return progress >= start && progress <= end
}

function sectionLabel(section: SceneWithFrames['section']): string {
  switch (section) {
    case 'problem':
      return 'Problem'
    case 'solution':
      return 'What We Built'
    case 'demo':
      return 'Demo'
    case 'adoption':
      return 'Adoption Plan'
    case 'cta':
      return 'Call To Action'
    default:
      return 'Scene'
  }
}

function statusColor(status: string): string {
  if (status === 'Stuck') return '#fca5a5'
  if (status === 'On Track') return '#86efac'
  if (status === 'Finished Step') return '#93c5fd'
  if (status === 'Waiting') return '#fcd34d'
  if (status === 'Idle') return '#fca5a5'
  if (status === 'Working') return '#86efac'
  return '#cbd5e1'
}

export function DemoReel({ aspect, withVoiceover = false }: DemoReelProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const isPortrait = aspect === 'portrait'

  const activeScene =
    SCENE_SPECS.find((scene) => frame >= scene.startFrame && frame < scene.endFrame) ??
    SCENE_SPECS[SCENE_SPECS.length - 1]

  const overallProgress = frame / DURATION_FRAMES
  const contentInsetX = isPortrait ? 48 : 72
  const topBarHeight = isPortrait ? 160 : 118
  const captionHeight = isPortrait ? 248 : 196

  return (
    <AbsoluteFill style={{ background: BG_GRADIENT, fontFamily: 'Arial, Helvetica, sans-serif', color: '#f8fafc' }}>
      <AnimatedBackdrop overallProgress={overallProgress} />

      <TopRail
        isPortrait={isPortrait}
        section={sectionLabel(activeScene.section)}
        title={activeScene.title}
        frame={frame}
      />

      <div
        style={{
          position: 'absolute',
          left: contentInsetX,
          right: contentInsetX,
          top: topBarHeight,
          bottom: captionHeight,
        }}
      >
        {SCENE_SPECS.map((scene) => (
          <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames}>
            <SceneFrame scene={scene} isPortrait={isPortrait} width={width} height={height} />
          </Sequence>
        ))}
      </div>

      <CaptionBox
        isPortrait={isPortrait}
        title={activeScene.title}
        section={sectionLabel(activeScene.section)}
        text={activeScene.text}
      />

      <TimelineFooter activeFrame={frame} isPortrait={isPortrait} />

      {withVoiceover &&
        SCENE_SPECS.map((scene) => (
          <Sequence key={`audio-${scene.id}`} from={scene.startFrame} durationInFrames={scene.durationFrames}>
            <Audio src={staticFile(`voiceover/audio/${scene.audioFile}`)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  )
}

function SceneFrame({
  scene,
  isPortrait,
  width,
  height,
}: {
  scene: SceneWithFrames
  isPortrait: boolean
  width: number
  height: number
}) {
  const localFrame = useCurrentFrame()
  const progress = clamp01(localFrame / Math.max(1, scene.durationFrames - 1))

  const entry = spring({
    frame: localFrame,
    fps: FPS,
    config: {
      damping: 16,
      mass: 0.8,
      stiffness: 120,
    },
  })

  const opacity = interpolate(
    localFrame,
    [0, 8, scene.durationFrames - 8, scene.durationFrames - 1],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  const cursor = getCursorState(scene.id, progress, isPortrait)

  return (
    <AbsoluteFill style={{ opacity, transform: `translateY(${mix(18, 0, entry)}px)` }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: isPortrait ? 24 : 28,
          border: '1px solid rgba(148, 163, 184, 0.28)',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.92))',
          boxShadow: '0 30px 60px rgba(2, 6, 23, 0.55)',
          overflow: 'hidden',
        }}
      >
        <SceneInner scene={scene} progress={progress} frame={localFrame} isPortrait={isPortrait} />
        <CursorOverlay cursor={cursor} width={width} height={height} />
      </div>
    </AbsoluteFill>
  )
}

function SceneInner({
  scene,
  progress,
  frame,
  isPortrait,
}: {
  scene: SceneWithFrames
  progress: number
  frame: number
  isPortrait: boolean
}) {
  switch (scene.id) {
    case 'problem-downtime':
      return <ProblemDowntimeScene progress={progress} frame={frame} isPortrait={isPortrait} />
    case 'problem-visibility':
      return <ProblemVisibilityScene progress={progress} frame={frame} isPortrait={isPortrait} />
    case 'solution-what-built':
      return <SolutionBuiltScene progress={progress} isPortrait={isPortrait} />
    case 'solution-value':
      return <SolutionValueScene progress={progress} isPortrait={isPortrait} />
    case 'demo-teacher-builder':
      return <TeacherBuilderScene progress={progress} frame={frame} isPortrait={isPortrait} />
    case 'demo-student-prelab':
      return <StudentPrelabScene progress={progress} isPortrait={isPortrait} />
    case 'demo-student-data':
      return <StudentDataScene progress={progress} frame={frame} isPortrait={isPortrait} />
    case 'demo-stuck-guidance':
      return <StuckGuidanceScene progress={progress} isPortrait={isPortrait} />
    case 'demo-monitor-grouping':
      return <MonitorGroupingScene progress={progress} isPortrait={isPortrait} />
    case 'demo-analytics':
      return <AnalyticsScene progress={progress} frame={frame} isPortrait={isPortrait} />
    case 'adoption-plan':
      return <AdoptionPlanScene progress={progress} isPortrait={isPortrait} />
    case 'cta':
      return <CtaScene progress={progress} isPortrait={isPortrait} />
    default:
      return null
  }
}

function ProblemDowntimeScene({
  progress,
  frame,
  isPortrait,
}: {
  progress: number
  frame: number
  isPortrait: boolean
}) {
  const pulse = 0.62 + Math.sin(frame / 7) * 0.08

  return (
    <SceneShell title="Classroom Momentum Drops" subtitle="Before live visibility, downtime compounds across steps." isPortrait={isPortrait}>
      <SplitLayout isPortrait={isPortrait}>
        <Panel>
          <h3 style={styles.h3}>Current Classroom Friction</h3>
          <ul style={styles.ul}>
            <li>Students pause while waiting for step clarification</li>
            <li>Repeated questions interrupt small-group instruction</li>
            <li>Teachers spend time searching for where support is needed</li>
          </ul>
          <div style={{ ...styles.alertBox, marginTop: 16 }}>
            <div style={{ fontSize: 13, color: '#fca5a5', fontWeight: 700 }}>Downtime Signal</div>
            <div style={{ marginTop: 6, fontSize: 16, lineHeight: 1.35 }}>
              Lost instructional minutes increase when progress is not visible step by step.
            </div>
          </div>
        </Panel>

        <Panel>
          <h3 style={styles.h3}>Live Snapshot (Without Unified Monitor)</h3>
          <div style={{ marginTop: 12, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.26)' }}>
            {PROBLEM_ROWS.map((row, index) => (
              <div
                key={row.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isPortrait ? '1.15fr 0.75fr' : '1fr 0.45fr 1fr',
                  gap: 10,
                  alignItems: 'center',
                  padding: '10px 12px',
                  fontSize: 14,
                  background: index % 2 === 0 ? 'rgba(15, 23, 42, 0.62)' : 'rgba(30, 41, 59, 0.62)',
                }}
              >
                <span style={{ fontWeight: 600 }}>{row.name}</span>
                <span style={{ color: statusColor(row.status), fontWeight: 700 }}>{row.status}</span>
                {!isPortrait && <span style={{ color: '#cbd5e1', opacity: pulse }}>{row.detail}</span>}
              </div>
            ))}
          </div>
          {isPortrait && (
            <div style={{ marginTop: 12, color: '#cbd5e1', fontSize: 13 }}>
              Teachers see partial signals, but not a complete step-level view of the room.
            </div>
          )}
        </Panel>
      </SplitLayout>

      <Callout
        text="Pain point: classroom time drains when progress and blockers are hidden."
        align="right"
        emphasis={progress}
      />
    </SceneShell>
  )
}

function ProblemVisibilityScene({
  progress,
  frame,
  isPortrait,
}: {
  progress: number
  frame: number
  isPortrait: boolean
}) {
  const lag = 0.55 + Math.sin(frame / 6) * 0.06

  return (
    <SceneShell title="Visibility Gap at the Step Level" subtitle="Status updates arrive late, and support decisions become reactive." isPortrait={isPortrait}>
      <SplitLayout isPortrait={isPortrait}>
        <Panel>
          <h3 style={styles.h3}>Disconnected Workflow</h3>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            {[
              'Paper notes and side conversations',
              'Manual status checks every few minutes',
              'Delayed identification of stuck students',
            ].map((item, idx) => (
              <div
                key={item}
                style={{
                  borderRadius: 12,
                  border: '1px solid rgba(248, 113, 113, 0.4)',
                  background: idx === 1 ? 'rgba(127, 29, 29, 0.38)' : 'rgba(15, 23, 42, 0.74)',
                  padding: '10px 12px',
                  fontSize: 15,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 style={styles.h3}>What the Teacher Sees</h3>
          <div
            style={{
              marginTop: 12,
              borderRadius: 14,
              border: '1px solid rgba(148,163,184,0.26)',
              padding: 14,
              background: 'rgba(2, 6, 23, 0.7)',
            }}
          >
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { label: 'Step completion updates', state: 'Delayed' },
                { label: 'Help request context', state: 'Fragmented' },
                { label: 'Grouping insights', state: 'Unavailable' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#e2e8f0', fontSize: 14 }}>{item.label}</span>
                  <span style={{ color: '#fca5a5', fontSize: 13, fontWeight: 700, opacity: lag }}>{item.state}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </SplitLayout>

      <Callout text="Need: one live source for student status, step progress, and intervention signals." align="left" emphasis={progress} />
    </SceneShell>
  )
}

function SolutionBuiltScene({
  progress,
  isPortrait,
}: {
  progress: number
  isPortrait: boolean
}) {
  const cards = [
    ['Lab Builder', 'Create and publish step-based labs in one flow'],
    ['Student Runner', 'Capture pre-lab, data entry, and reflections'],
    ['Live Monitor', 'Track status by student and step in real time'],
    ['Analytics', 'Surface patterns for grouping and coaching decisions'],
  ]

  return (
    <SceneShell title="One Connected Workflow" subtitle="LabFlow links planning, execution, and classroom insight." isPortrait={isPortrait}>
      <div style={{ display: 'grid', gridTemplateColumns: isPortrait ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
        {cards.map(([title, detail], idx) => {
          const reveal = clamp01(progress * 1.6 - idx * 0.22)
          return (
            <div
              key={title}
              style={{
                borderRadius: 16,
                border: '1px solid rgba(147, 197, 253, 0.34)',
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.76), rgba(15, 23, 42, 0.86))',
                padding: isPortrait ? '14px 16px' : '16px 18px',
                opacity: reveal,
                transform: `translateY(${mix(16, 0, reveal)}px)`,
              }}
            >
              <div style={{ fontSize: isPortrait ? 19 : 21, fontWeight: 800, color: '#bfdbfe' }}>{title}</div>
              <div style={{ marginTop: 8, fontSize: isPortrait ? 14 : 15, lineHeight: 1.4, color: '#dbeafe' }}>{detail}</div>
            </div>
          )
        })}
      </div>

      <Callout text="Built for less downtime, faster visibility, and stronger instructional decisions." align="right" emphasis={progress} />
    </SceneShell>
  )
}

function SolutionValueScene({
  progress,
  isPortrait,
}: {
  progress: number
  isPortrait: boolean
}) {
  return (
    <SceneShell title="Value for Teachers and Administrators" subtitle="A practical system for instructional time and classroom clarity." isPortrait={isPortrait}>
      <SplitLayout isPortrait={isPortrait}>
        <Panel>
          <h3 style={styles.h3}>Before vs After</h3>
          <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
            <CompareRow left="Manual check-ins" right="Live step-level status" progress={progress} />
            <CompareRow left="Delayed help context" right="In-context support signals" progress={progress} />
            <CompareRow left="Hard-to-form groups" right="Actionable grouping cues" progress={progress} />
          </div>
        </Panel>

        <Panel>
          <h3 style={styles.h3}>What This Unlocks</h3>
          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            {[
              'More learning time, less operational overhead',
              'Faster access to student work and step progress',
              'Clear analytics for instructional grouping',
              'A better classroom environment that values everyone\'s time',
            ].map((item, index) => (
              <div
                key={item}
                style={{
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.3)',
                  background: 'rgba(15, 23, 42, 0.72)',
                  padding: '10px 12px',
                  fontSize: 14,
                  opacity: clamp01(progress * 1.4 - index * 0.12),
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </SplitLayout>
    </SceneShell>
  )
}

function TeacherBuilderScene({
  progress,
  frame,
  isPortrait,
}: {
  progress: number
  frame: number
  isPortrait: boolean
}) {
  const prompt =
    'Build a step-by-step lab where students test one variable, collect data across multiple trials, and justify a claim from evidence.'
  const typedCount = Math.floor(prompt.length * clamp01(progress * 1.25))
  const typedPrompt = prompt.slice(0, typedCount)

  const generationState =
    progress < 0.38
      ? 'Prompt ready'
      : progress < 0.62
        ? 'Generating draft...'
        : progress < 0.82
          ? 'Refining sections...'
          : 'Ready to publish'

  const savePulse = 0.65 + Math.sin(frame / 7) * 0.12

  return (
    <SceneShell title="Teacher Creates and Publishes a Lab" subtitle="Mimicking the real lab builder workflow used in the app." isPortrait={isPortrait}>
      <SplitLayout isPortrait={isPortrait}>
        <Panel>
          <h3 style={styles.h3}>Create New Lab</h3>
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            <div style={styles.label}>Prompt</div>
            <div style={styles.inputBox}>{typedPrompt || ' '}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
              <Chip label="Grade 9-12" />
              <Chip label="Data Lab" />
              <Chip label="50 min" />
            </div>
            <ButtonBlock
              label={progress < 0.3 ? 'Generate Draft' : generationState}
              active={between(progress, 0.32, 0.64)}
            />
          </div>
        </Panel>

        <Panel>
          <h3 style={styles.h3}>Lab Builder (7-Step Editor)</h3>
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            <WizardRow step={1} label="Overview" active={progress > 0.48} />
            <WizardRow step={2} label="Materials and Safety" active={progress > 0.56} />
            <WizardRow step={5} label="Procedure" active={progress > 0.66} />
            <WizardRow step={6} label="Rubric" active={progress > 0.74} />
            <WizardRow step={7} label="Review and Publish" active={progress > 0.84} />

            <div
              style={{
                marginTop: 6,
                borderRadius: 12,
                border: '1px solid rgba(34, 197, 94, 0.45)',
                background: 'rgba(15, 118, 110, 0.2)',
                padding: '10px 12px',
                fontSize: 14,
              }}
            >
              Auto-save status: <span style={{ color: '#86efac', opacity: savePulse }}>Saved</span>
            </div>
          </div>
        </Panel>
      </SplitLayout>

      <Callout text="Teacher remains in control; AI support stays in the background." align="right" emphasis={progress} />
    </SceneShell>
  )
}

function StudentPrelabScene({
  progress,
  isPortrait,
}: {
  progress: number
  isPortrait: boolean
}) {
  return (
    <SceneShell title="Student Starts Assigned Lab" subtitle="My Labs, pre-lab prompts, and structured progression." isPortrait={isPortrait}>
      <SplitLayout isPortrait={isPortrait}>
        <Panel>
          <h3 style={styles.h3}>My Labs</h3>
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            <LabCard title="Investigating Variables Through Controlled Trials" status="In Progress" progressText="Pre-Lab required" />
            <LabCard title="Measurement and Data Collection" status="Complete" progressText="Submitted" />
          </div>
        </Panel>

        <Panel>
          <h3 style={styles.h3}>Pre-Lab Questions</h3>
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            <QuestionRow
              question="What variable will change across trials?"
              answer="Distance from light source"
              visible={progress > 0.22}
            />
            <QuestionRow
              question="What outcome do you predict?"
              answer="Output increases as distance decreases"
              visible={progress > 0.5}
            />
            <QuestionRow
              question="What evidence will you record each step?"
              answer="Trial counts, averages, and reflection notes"
              visible={progress > 0.75}
            />
            <ButtonBlock label="Submit Pre-Lab" active={progress > 0.78} />
          </div>
        </Panel>
      </SplitLayout>
    </SceneShell>
  )
}

function StudentDataScene({
  progress,
  frame,
  isPortrait,
}: {
  progress: number
  frame: number
  isPortrait: boolean
}) {
  const saveState = progress < 0.38 ? 'Saving...' : progress < 0.7 ? 'Saved' : 'Saved and ready to continue'
  const saveColor = progress < 0.38 ? '#fcd34d' : '#86efac'
  const pulse = 0.7 + Math.sin(frame / 8) * 0.08

  return (
    <SceneShell title="Student Data Entry and Reflection" subtitle="Step-level capture mirrors the real runner interface." isPortrait={isPortrait}>
      <Panel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h3 style={styles.h3}>Step 2 of 5 - Variable Trial</h3>
          <span style={{ color: '#bfdbfe', fontWeight: 700 }}>40% complete</span>
        </div>

        <div style={{ marginTop: 10, height: 8, borderRadius: 8, background: 'rgba(148,163,184,0.25)' }}>
          <div
            style={{
              width: `${mix(35, 72, progress)}%`,
              height: '100%',
              borderRadius: 8,
              background: 'linear-gradient(90deg, #38bdf8, #2563eb)',
            }}
          />
        </div>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: isPortrait ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <DataField label="Trial Distance (cm)" value={progress > 0.24 ? '10' : ''} />
          <DataField label="Data Count (avg)" value={progress > 0.4 ? '24' : ''} />
          <DataField label="Observed Pattern" value={progress > 0.57 ? 'Output increased as variable changed' : ''} wide={isPortrait} />
          <DataField label="Reflection" value={progress > 0.72 ? 'Evidence supports a positive relationship across trials.' : ''} wide />
        </div>

        <div style={{ marginTop: 14, color: saveColor, fontWeight: 700, opacity: pulse }}>{saveState}</div>

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <ButtonBlock label="Mark Step Complete" active={progress > 0.76} width={isPortrait ? 220 : 260} />
        </div>
      </Panel>
    </SceneShell>
  )
}

function StuckGuidanceScene({
  progress,
  isPortrait,
}: {
  progress: number
  isPortrait: boolean
}) {
  const guidance = [
    'Compare Trial 1 and Trial 2 before writing your claim.',
    'Check units and average the repeated measurements.',
    'Use one sentence that links data trend to your conclusion.',
  ]

  return (
    <SceneShell title="Student Gets Stuck, Then Recovers" subtitle="Guided support appears in context while teacher oversight remains central." isPortrait={isPortrait}>
      <SplitLayout isPortrait={isPortrait}>
        <Panel>
          <h3 style={styles.h3}>Student Context</h3>
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            <StatusBadge label={progress < 0.24 ? 'On Track' : progress < 0.72 ? 'Stuck' : 'Back on Track'} />
            <div style={styles.noteCard}>
              Step 3 requires evidence-backed interpretation. Student paused and requested help.
            </div>
            <ButtonBlock label={progress < 0.28 ? 'Get Help on This Step' : 'Help Requested'} active={progress >= 0.28} />
          </div>
        </Panel>

        <Panel>
          <h3 style={styles.h3}>Guided Help Thread</h3>
          <div style={{ marginTop: 10, display: 'grid', gap: 9 }}>
            {guidance.map((item, idx) => {
              const visible = progress > 0.36 + idx * 0.17
              return (
                <div
                  key={item}
                  style={{
                    borderRadius: 12,
                    border: '1px solid rgba(125, 211, 252, 0.35)',
                    background: 'rgba(2, 132, 199, 0.17)',
                    padding: '10px 12px',
                    fontSize: 14,
                    color: '#dbeafe',
                    opacity: visible ? 1 : 0.2,
                  }}
                >
                  {item}
                </div>
              )
            })}
            <div style={{ ...styles.noteCard, borderColor: 'rgba(34, 197, 94, 0.4)', background: 'rgba(22, 101, 52, 0.26)' }}>
              Outcome: student revises claim and continues.
            </div>
          </div>
        </Panel>
      </SplitLayout>
    </SceneShell>
  )
}

function MonitorGroupingScene({
  progress,
  isPortrait,
}: {
  progress: number
  isPortrait: boolean
}) {
  return (
    <SceneShell title="Teacher Live Monitor and Grouping" subtitle="Real-time status helps teachers intervene quickly and intentionally." isPortrait={isPortrait}>
      <Panel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h3 style={styles.h3}>Period 3 - Live Monitor</h3>
          <span style={{ color: '#86efac', fontSize: 13, fontWeight: 700 }}>Live updates</span>
        </div>

        <div
          style={{
            marginTop: 12,
            display: 'grid',
            gridTemplateColumns: isPortrait ? '1fr' : 'repeat(4, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          {MONITOR_ROWS.map((row) => {
            const stuck = row.status === 'Stuck'
            return (
              <div
                key={row.name}
                style={{
                  borderRadius: 12,
                  border: `1px solid ${stuck ? 'rgba(248, 113, 113, 0.5)' : 'rgba(148, 163, 184, 0.28)'}`,
                  background: stuck ? 'rgba(127, 29, 29, 0.36)' : 'rgba(15, 23, 42, 0.74)',
                  padding: '10px 11px',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>{row.name}</div>
                <div style={{ marginTop: 4, color: '#cbd5e1', fontSize: 12 }}>Step {row.step}</div>
                <div style={{ marginTop: 6, color: statusColor(row.status), fontSize: 12, fontWeight: 700 }}>{row.status}</div>
              </div>
            )
          })}
        </div>

        <div
          style={{
            marginTop: 12,
            borderRadius: 12,
            border: '1px solid rgba(248,113,113,0.45)',
            background: 'rgba(127, 29, 29, 0.35)',
            padding: '10px 12px',
            opacity: progress > 0.22 ? 1 : 0.25,
          }}
        >
          Grouping cue: multiple students are stuck on Step 3. Suggestion: pause and model one full interpretation example.
        </div>
      </Panel>
    </SceneShell>
  )
}

function AnalyticsScene({
  progress,
  frame,
  isPortrait,
}: {
  progress: number
  frame: number
  isPortrait: boolean
}) {
  const lineHeights = [35, 42, 50, 60, 72]
  const barHeights = [72, 56, 34, 20]

  return (
    <SceneShell title="Analytics for Grouping and Leadership" subtitle="Trend visibility supports coaching, planning, and classroom improvement." isPortrait={isPortrait}>
      <SplitLayout isPortrait={isPortrait}>
        <Panel>
          <h3 style={styles.h3}>Completion Trend</h3>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {lineHeights.map((height, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${mix(20, height, progress)}%`,
                    borderRadius: 8,
                    background: 'linear-gradient(180deg, #38bdf8, #1d4ed8)',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, color: '#cbd5e1', fontSize: 13 }}>Pattern: classroom completion trajectory is moving upward.</div>
        </Panel>

        <Panel>
          <h3 style={styles.h3}>Support Focus by Step</h3>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
            {barHeights.map((height, idx) => (
              <div key={idx} style={{ flex: 1, display: 'grid', gap: 6 }}>
                <div
                  style={{
                    height: `${mix(18, height, progress)}%`,
                    borderRadius: 8,
                    background: idx === 2 ? 'linear-gradient(180deg, #fca5a5, #ef4444)' : 'linear-gradient(180deg, #93c5fd, #3b82f6)',
                  }}
                />
                <div style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1' }}>Step {idx + 1}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            {['Completion rate', 'Help-response time', 'Grading time saved'].map((label, idx) => (
              <div key={label} style={{ ...styles.metricRow, opacity: clamp01(progress * 1.4 - idx * 0.18) }}>
                <span>{label}</span>
                <span style={{ color: '#86efac', fontWeight: 700 }}>{idx === 1 ? 'Tracking faster' : 'Tracking improvement'}</span>
              </div>
            ))}
          </div>
        </Panel>
      </SplitLayout>

      <Callout text="Analytics are used for grouping, coaching, and faster instructional decisions." align="right" emphasis={0.7 + Math.sin(frame / 10) * 0.1} />
    </SceneShell>
  )
}

function AdoptionPlanScene({
  progress,
  isPortrait,
}: {
  progress: number
  isPortrait: boolean
}) {
  const phases = [
    ['Week 1', 'Teacher setup and onboarding'],
    ['Week 2', 'Pilot launch in 2-3 classes'],
    ['Week 3', 'Coaching based on live monitor + analytics'],
    ['Week 4', 'Review metrics and decide scale plan'],
  ]

  return (
    <SceneShell title="30-Day Adoption Plan" subtitle="High school and higher, step-based and data-rich instruction." isPortrait={isPortrait}>
      <SplitLayout isPortrait={isPortrait}>
        <Panel>
          <h3 style={styles.h3}>Pilot Scope</h3>
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            <InfoTile label="Audience" value="Administrators and teachers" />
            <InfoTile label="Grade Band" value="High school and higher" />
            <InfoTile label="Best Fit" value="Courses with step-by-step work and repeated data input" />
          </div>
        </Panel>

        <Panel>
          <h3 style={styles.h3}>Rollout Sequence</h3>
          <div style={{ marginTop: 10, display: 'grid', gap: 9 }}>
            {phases.map(([week, detail], idx) => (
              <div
                key={week}
                style={{
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.3)',
                  background: 'rgba(15, 23, 42, 0.74)',
                  padding: '10px 12px',
                  opacity: clamp01(progress * 1.6 - idx * 0.18),
                }}
              >
                <div style={{ fontSize: 13, color: '#93c5fd', fontWeight: 700 }}>{week}</div>
                <div style={{ marginTop: 4, fontSize: 14 }}>{detail}</div>
              </div>
            ))}
          </div>
        </Panel>
      </SplitLayout>

      <Callout text="Success metrics to review: completion rate, help-response time, grading time saved." align="left" emphasis={progress} />
    </SceneShell>
  )
}

function CtaScene({
  progress,
  isPortrait,
}: {
  progress: number
  isPortrait: boolean
}) {
  return (
    <SceneShell title="Try the Demo Now" subtitle="See the teacher, student, and admin flow in one live experience." isPortrait={isPortrait}>
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          height: '100%',
        }}
      >
        <div
          style={{
            width: isPortrait ? '94%' : '78%',
            borderRadius: 22,
            border: '1px solid rgba(56, 189, 248, 0.42)',
            background: 'linear-gradient(180deg, rgba(8, 47, 73, 0.78), rgba(2, 6, 23, 0.9))',
            padding: isPortrait ? '28px 22px' : '34px 30px',
            boxShadow: '0 24px 54px rgba(2,6,23,0.6)',
          }}
        >
          <div style={{ fontSize: isPortrait ? 22 : 26, fontWeight: 800, color: '#e0f2fe' }}>
            Create a more responsive classroom environment.
          </div>
          <div style={{ marginTop: 10, color: '#bfdbfe', fontSize: isPortrait ? 16 : 18 }}>
            Value everyone\'s time with faster visibility and better instructional focus.
          </div>

          <div
            style={{
              marginTop: 22,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 14,
              border: '1px solid rgba(34,197,94,0.5)',
              background: 'rgba(22, 101, 52, 0.36)',
              padding: '12px 18px',
              fontSize: isPortrait ? 20 : 24,
              fontWeight: 900,
              letterSpacing: 0.3,
              transform: `scale(${mix(0.95, 1.02, progress)})`,
            }}
          >
            Try the demo now
          </div>

          <div style={{ marginTop: 14, fontSize: isPortrait ? 19 : 22, color: '#86efac', fontWeight: 800 }}>/demo/try</div>
        </div>
      </div>
    </SceneShell>
  )
}

function AnimatedBackdrop({ overallProgress }: { overallProgress: number }) {
  const offsetA = mix(0, -80, overallProgress)
  const offsetB = mix(40, -40, overallProgress)

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: 999,
          top: -180,
          left: offsetA,
          background: 'radial-gradient(circle, rgba(59,130,246,0.18), transparent 65%)',
          filter: 'blur(14px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 620,
          height: 620,
          borderRadius: 999,
          bottom: -240,
          right: offsetB,
          background: 'radial-gradient(circle, rgba(220,38,38,0.2), transparent 68%)',
          filter: 'blur(16px)',
        }}
      />
    </AbsoluteFill>
  )
}

function TopRail({
  isPortrait,
  section,
  title,
  frame,
}: {
  isPortrait: boolean
  section: string
  title: string
  frame: number
}) {
  const pulse = 0.76 + Math.sin(frame / 9) * 0.08

  return (
    <div
      style={{
        position: 'absolute',
        left: isPortrait ? 46 : 70,
        right: isPortrait ? 46 : 70,
        top: isPortrait ? 34 : 28,
        borderRadius: 16,
        border: '1px solid rgba(148, 163, 184, 0.32)',
        background: 'rgba(15, 23, 42, 0.65)',
        padding: isPortrait ? '12px 14px' : '12px 18px',
        display: 'flex',
        flexDirection: isPortrait ? 'column' : 'row',
        alignItems: isPortrait ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <div>
        <div style={{ color: '#93c5fd', fontWeight: 700, letterSpacing: 0.4, fontSize: 12 }}>LABFLOW DEMO REEL</div>
        <div style={{ marginTop: 3, fontWeight: 800, fontSize: isPortrait ? 18 : 20 }}>{title}</div>
      </div>
      <div
        style={{
          borderRadius: 999,
          border: '1px solid rgba(34, 197, 94, 0.5)',
          background: 'rgba(22, 101, 52, 0.34)',
          padding: '6px 11px',
          fontSize: 12,
          fontWeight: 700,
          color: '#bbf7d0',
          opacity: pulse,
          alignSelf: isPortrait ? 'stretch' : 'auto',
        }}
      >
        {section}
      </div>
    </div>
  )
}

function CaptionBox({
  isPortrait,
  section,
  title,
  text,
}: {
  isPortrait: boolean
  section: string
  title: string
  text: string
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: isPortrait ? 46 : 70,
        right: isPortrait ? 46 : 70,
        bottom: isPortrait ? 74 : 66,
        borderRadius: 16,
        border: '1px solid rgba(148, 163, 184, 0.34)',
        background: 'rgba(2, 6, 23, 0.8)',
        padding: isPortrait ? '14px 14px' : '14px 18px',
      }}
    >
      <div style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>{section.toUpperCase()}</div>
      <div style={{ marginTop: 3, fontSize: isPortrait ? 16 : 18, fontWeight: 800 }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: isPortrait ? 14 : 15, lineHeight: 1.4, color: '#e2e8f0' }}>{text}</div>
    </div>
  )
}

function TimelineFooter({ activeFrame, isPortrait }: { activeFrame: number; isPortrait: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: isPortrait ? 46 : 70,
        right: isPortrait ? 46 : 70,
        bottom: isPortrait ? 38 : 32,
        height: 10,
        borderRadius: 999,
        background: 'rgba(148,163,184,0.26)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${(activeFrame / DURATION_FRAMES) * 100}%`,
          height: '100%',
          borderRadius: 999,
          background: 'linear-gradient(90deg, #38bdf8, #2563eb, #22c55e)',
        }}
      />
    </div>
  )
}

function SceneShell({
  title,
  subtitle,
  children,
  isPortrait,
}: {
  title: string
  subtitle: string
  children: ReactNode
  isPortrait: boolean
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, padding: isPortrait ? 20 : 24 }}>
      <div style={{ fontSize: isPortrait ? 22 : 28, fontWeight: 900, color: '#f8fafc' }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: isPortrait ? 14 : 15, color: '#cbd5e1' }}>{subtitle}</div>
      <div style={{ marginTop: 14, height: `calc(100% - ${isPortrait ? 74 : 82}px)` }}>{children}</div>
    </div>
  )
}

function SplitLayout({ isPortrait, children }: { isPortrait: boolean; children: ReactNode }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: isPortrait ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 14,
      }}
    >
      {children}
    </div>
  )
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid rgba(148, 163, 184, 0.28)',
        background: 'rgba(15, 23, 42, 0.72)',
        padding: 14,
        minHeight: 0,
      }}
    >
      {children}
    </div>
  )
}

function Callout({ text, align, emphasis }: { text: string; align: 'left' | 'right'; emphasis: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 10,
        [align]: 0,
        maxWidth: 460,
        borderRadius: 12,
        border: '1px solid rgba(56, 189, 248, 0.45)',
        background: 'rgba(8, 47, 73, 0.52)',
        padding: '9px 12px',
        fontSize: 13,
        color: '#e0f2fe',
        opacity: clamp01(emphasis),
      }}
    >
      {text}
    </div>
  )
}

function CompareRow({ left, right, progress }: { left: string; right: string; progress: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
      <div style={{ ...styles.compareCell, borderColor: 'rgba(248,113,113,0.4)', color: '#fecaca' }}>{left}</div>
      <div style={{ fontSize: 16, color: '#94a3b8' }}>{'->'}</div>
      <div
        style={{
          ...styles.compareCell,
          borderColor: 'rgba(34,197,94,0.45)',
          color: '#bbf7d0',
          opacity: clamp01(progress * 1.3),
        }}
      >
        {right}
      </div>
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <div
      style={{
        borderRadius: 999,
        border: '1px solid rgba(148,163,184,0.35)',
        background: 'rgba(15, 23, 42, 0.82)',
        padding: '6px 10px',
        fontSize: 12,
        color: '#cbd5e1',
        textAlign: 'center',
      }}
    >
      {label}
    </div>
  )
}

function ButtonBlock({
  label,
  active,
  width,
}: {
  label: string
  active: boolean
  width?: number
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${active ? 'rgba(56,189,248,0.6)' : 'rgba(148,163,184,0.35)'}`,
        background: active ? 'rgba(8, 145, 178, 0.36)' : 'rgba(30, 41, 59, 0.72)',
        padding: '10px 12px',
        width: width ?? '100%',
        textAlign: 'center',
        fontWeight: 700,
        color: active ? '#e0f2fe' : '#cbd5e1',
      }}
    >
      {label}
    </div>
  )
}

function WizardRow({ step, label, active }: { step: number; label: string; active: boolean }) {
  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${active ? 'rgba(56,189,248,0.55)' : 'rgba(148,163,184,0.26)'}`,
        background: active ? 'rgba(30, 64, 175, 0.3)' : 'rgba(15, 23, 42, 0.72)',
        padding: '8px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
      }}
    >
      <span>
        Step {step}: {label}
      </span>
      <span style={{ color: active ? '#93c5fd' : '#94a3b8', fontWeight: 700 }}>{active ? 'Active' : 'Queued'}</span>
    </div>
  )
}

function LabCard({ title, status, progressText }: { title: string; status: string; progressText: string }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.3)',
        background: 'rgba(15, 23, 42, 0.72)',
        padding: '10px 12px',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
      <div style={{ marginTop: 5, fontSize: 12, color: '#cbd5e1' }}>{progressText}</div>
      <div style={{ marginTop: 7, fontSize: 12, color: '#93c5fd', fontWeight: 700 }}>{status}</div>
    </div>
  )
}

function QuestionRow({
  question,
  answer,
  visible,
}: {
  question: string
  answer: string
  visible: boolean
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.3)',
        background: 'rgba(15, 23, 42, 0.72)',
        padding: '9px 10px',
        opacity: visible ? 1 : 0.3,
      }}
    >
      <div style={{ fontSize: 13, color: '#e2e8f0' }}>{question}</div>
      <div style={{ marginTop: 5, fontSize: 12, color: '#bbf7d0' }}>{visible ? answer : 'Waiting for response...'}</div>
    </div>
  )
}

function DataField({
  label,
  value,
  wide = false,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.3)',
        background: 'rgba(15, 23, 42, 0.72)',
        padding: '10px 12px',
        gridColumn: wide ? '1 / -1' : undefined,
      }}
    >
      <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 6 }}>{label}</div>
      <div style={{ minHeight: 20, color: '#e2e8f0', fontSize: 14 }}>{value || ' '}</div>
    </div>
  )
}

function StatusBadge({ label }: { label: string }) {
  const tone = label === 'Stuck' ? '#fca5a5' : label === 'Back on Track' ? '#86efac' : '#93c5fd'
  return (
    <div
      style={{
        borderRadius: 999,
        border: `1px solid ${tone}`,
        background: 'rgba(15, 23, 42, 0.72)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 12px',
        width: 'fit-content',
        color: tone,
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {label}
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.3)',
        background: 'rgba(15, 23, 42, 0.72)',
        padding: '10px 12px',
      }}
    >
      <div style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 14, color: '#e2e8f0' }}>{value}</div>
    </div>
  )
}

function CursorOverlay({ cursor, width, height }: { cursor: CursorState; width: number; height: number }) {
  if (!cursor.visible) return null

  const x = (cursor.xPercent / 100) * width
  const y = (cursor.yPercent / 100) * height

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 18,
          height: 18,
          borderRadius: 999,
          background: '#f8fafc',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 0 4px rgba(15, 23, 42, 0.65)',
          zIndex: 20,
        }}
      />
      {cursor.click && (
        <>
          <PulseRing x={x} y={y} delay={0} />
          <PulseRing x={x} y={y} delay={4} />
        </>
      )}
    </>
  )
}

function PulseRing({ x, y, delay }: { x: number; y: number; delay: number }) {
  const localFrame = useCurrentFrame()
  const ringProgress = clamp01((localFrame - delay) / 8)
  const size = mix(18, 52, ringProgress)

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: 999,
        border: '2px solid rgba(125, 211, 252, 0.8)',
        transform: 'translate(-50%, -50%)',
        opacity: 1 - ringProgress,
        zIndex: 19,
      }}
    />
  )
}

function getCursorState(sceneId: string, progress: number, isPortrait: boolean): CursorState {
  const pt = (x: number, y: number, click: boolean): CursorState => ({
    xPercent: x,
    yPercent: y,
    click,
    visible: true,
  })

  const hidden: CursorState = { xPercent: 0, yPercent: 0, click: false, visible: false }

  switch (sceneId) {
    case 'demo-teacher-builder': {
      const startX = isPortrait ? 40 : 32
      const startY = isPortrait ? 39 : 42
      if (progress < 0.45) {
        return pt(mix(startX, startX + 12, progress / 0.45), mix(startY, startY + 5, progress / 0.45), between(progress, 0.34, 0.39))
      }
      if (progress < 0.8) {
        return pt(mix(startX + 12, isPortrait ? 66 : 74, (progress - 0.45) / 0.35), mix(startY + 5, isPortrait ? 46 : 40, (progress - 0.45) / 0.35), between(progress, 0.58, 0.63))
      }
      return pt(isPortrait ? 66 : 74, isPortrait ? 46 : 40, between(progress, 0.84, 0.9))
    }
    case 'demo-student-prelab': {
      if (progress < 0.5) {
        return pt(mix(isPortrait ? 31 : 28, isPortrait ? 36 : 31, progress / 0.5), mix(45, 58, progress / 0.5), between(progress, 0.24, 0.3))
      }
      return pt(mix(isPortrait ? 36 : 31, isPortrait ? 67 : 72, (progress - 0.5) / 0.5), mix(58, 64, (progress - 0.5) / 0.5), between(progress, 0.78, 0.84))
    }
    case 'demo-student-data': {
      if (progress < 0.6) {
        return pt(mix(isPortrait ? 33 : 36, isPortrait ? 60 : 52, progress / 0.6), mix(54, 60, progress / 0.6), between(progress, 0.3, 0.36))
      }
      return pt(mix(isPortrait ? 60 : 52, isPortrait ? 71 : 76, (progress - 0.6) / 0.4), mix(60, 71, (progress - 0.6) / 0.4), between(progress, 0.8, 0.87))
    }
    case 'demo-stuck-guidance': {
      if (progress < 0.45) {
        return pt(isPortrait ? 35 : 34, isPortrait ? 62 : 66, between(progress, 0.22, 0.3))
      }
      return pt(mix(isPortrait ? 35 : 34, isPortrait ? 66 : 69, (progress - 0.45) / 0.55), mix(isPortrait ? 62 : 66, isPortrait ? 54 : 48, (progress - 0.45) / 0.55), between(progress, 0.58, 0.64))
    }
    case 'demo-monitor-grouping': {
      if (progress < 0.6) {
        return pt(mix(isPortrait ? 50 : 55, isPortrait ? 67 : 64, progress / 0.6), mix(48, 56, progress / 0.6), between(progress, 0.42, 0.48))
      }
      return pt(mix(isPortrait ? 67 : 64, isPortrait ? 58 : 61, (progress - 0.6) / 0.4), mix(56, 67, (progress - 0.6) / 0.4), between(progress, 0.78, 0.86))
    }
    case 'demo-analytics': {
      return pt(mix(isPortrait ? 38 : 35, isPortrait ? 68 : 69, progress), mix(56, 64, progress), between(progress, 0.62, 0.7))
    }
    case 'cta': {
      return pt(isPortrait ? 50 : 52, isPortrait ? 61 : 60, between(progress, 0.4, 0.52))
    }
    default:
      return hidden
  }
}

const styles: Record<string, CSSProperties> = {
  h3: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    color: '#e2e8f0',
  },
  ul: {
    margin: '10px 0 0 18px',
    padding: 0,
    display: 'grid',
    gap: 8,
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 1.4,
  },
  alertBox: {
    borderRadius: 12,
    border: '1px solid rgba(248,113,113,0.5)',
    background: 'rgba(127, 29, 29, 0.35)',
    padding: '10px 12px',
  },
  label: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  inputBox: {
    borderRadius: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    background: 'rgba(15, 23, 42, 0.72)',
    minHeight: 72,
    padding: '10px 12px',
    fontSize: 14,
    lineHeight: 1.4,
    color: '#e2e8f0',
  },
  noteCard: {
    borderRadius: 12,
    border: '1px solid rgba(148,163,184,0.3)',
    background: 'rgba(15, 23, 42, 0.72)',
    padding: '10px 12px',
    fontSize: 14,
    lineHeight: 1.35,
    color: '#e2e8f0',
  },
  compareCell: {
    borderRadius: 10,
    border: '1px solid rgba(148,163,184,0.3)',
    background: 'rgba(15, 23, 42, 0.72)',
    padding: '8px 10px',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: 700,
  },
  metricRow: {
    borderRadius: 10,
    border: '1px solid rgba(148,163,184,0.28)',
    background: 'rgba(15, 23, 42, 0.72)',
    padding: '8px 10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    color: '#e2e8f0',
  },
}
