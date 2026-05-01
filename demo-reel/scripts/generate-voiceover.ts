import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import dotenv from 'dotenv'

interface SceneSpec {
  id: string
  section: 'problem' | 'solution' | 'demo' | 'adoption' | 'cta'
  title: string
  startSeconds: number
  endSeconds: number
  audioFile: string
  text: string
}

interface ManifestEntry {
  id: string
  section: SceneSpec['section']
  title: string
  startSeconds: number
  endSeconds: number
  audioFile: string
  generatedAt: string
}

const DEFAULT_MODEL = 'eleven_turbo_v2_5'
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/voiceover/audio')
const SCENES_PATH = path.resolve(process.cwd(), 'voiceover/script-scenes.json')
const MANIFEST_PATH = path.resolve(OUTPUT_DIR, 'manifest.json')

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function loadScenes(): SceneSpec[] {
  const raw = JSON.parse(readFileSync(SCENES_PATH, 'utf-8')) as unknown
  if (!Array.isArray(raw)) {
    throw new Error('script-scenes.json must be an array')
  }
  return raw as SceneSpec[]
}

async function generateSceneAudio(
  scene: SceneSpec,
  apiKey: string,
  voiceId: string,
  modelId: string
): Promise<Uint8Array> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: scene.text,
      model_id: modelId,
      voice_settings: {
        stability: 0.52,
        similarity_boost: 0.7,
        style: 0.12,
        use_speaker_boost: true,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs request failed (${response.status}): ${errorText}`)
  }

  return new Uint8Array(await response.arrayBuffer())
}

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') })

  const dryRun = process.argv.includes('--dry-run')
  const apiKey = process.env.ELEVENLABS_API_KEY ?? ''
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? ''
  const modelId = process.env.ELEVENLABS_MODEL_ID ?? DEFAULT_MODEL

  const scenes = loadScenes()

  if (!dryRun && (!apiKey || !voiceId)) {
    throw new Error(
      'Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID. Add them to demo-reel/.env or run with --dry-run.'
    )
  }

  mkdirSync(OUTPUT_DIR, { recursive: true })

  const manifest: ManifestEntry[] = []

  for (const scene of scenes) {
    const outputPath = path.resolve(OUTPUT_DIR, scene.audioFile)
    const timestamp = new Date().toISOString()

    console.log(`\n[${scene.id}] ${scene.startSeconds}s-${scene.endSeconds}s`)
    console.log(`Text: ${scene.text}`)

    if (dryRun) {
      console.log(`Dry run: skipping API call, would write ${outputPath}`)
    } else {
      const audioBytes = await generateSceneAudio(scene, apiKey, voiceId, modelId)
      writeFileSync(outputPath, audioBytes)
      console.log(`Wrote ${outputPath}`)
      await sleep(250)
    }

    manifest.push({
      id: scene.id,
      section: scene.section,
      title: scene.title,
      startSeconds: scene.startSeconds,
      endSeconds: scene.endSeconds,
      audioFile: scene.audioFile,
      generatedAt: timestamp,
    })
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify({ modelId, dryRun, scenes: manifest }, null, 2))
  console.log(`\nUpdated manifest: ${MANIFEST_PATH}`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Voiceover generation failed: ${message}`)
  process.exit(1)
})
