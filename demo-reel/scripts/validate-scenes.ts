import { readFileSync } from 'node:fs'
import path from 'node:path'

interface SceneSpec {
  id: string
  section: 'problem' | 'solution' | 'demo' | 'adoption' | 'cta'
  title: string
  startSeconds: number
  endSeconds: number
  audioFile: string
  text: string
}

const FPS = 30
const EXPECTED_SECONDS = 180
const EXPECTED_FRAMES = EXPECTED_SECONDS * FPS

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function readScenes(): SceneSpec[] {
  const filePath = path.resolve(process.cwd(), 'voiceover/script-scenes.json')
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as unknown
  assert(Array.isArray(raw), 'script-scenes.json must be an array')
  return raw as SceneSpec[]
}

function main() {
  const scenes = readScenes()
  assert(scenes.length > 0, 'No scenes found in script-scenes.json')

  let cursor = 0
  for (const scene of scenes) {
    assert(typeof scene.id === 'string' && scene.id.length > 0, 'Scene id is required')
    assert(typeof scene.audioFile === 'string' && scene.audioFile.endsWith('.mp3'), `Scene ${scene.id} must include an .mp3 audioFile`)
    assert(typeof scene.text === 'string' && scene.text.trim().length > 0, `Scene ${scene.id} must include narration text`)
    assert(scene.startSeconds === cursor, `Scene ${scene.id} must start at ${cursor}s, got ${scene.startSeconds}s`)
    assert(scene.endSeconds > scene.startSeconds, `Scene ${scene.id} must have a positive duration`)
    cursor = scene.endSeconds
  }

  assert(cursor === EXPECTED_SECONDS, `Total timeline must end at ${EXPECTED_SECONDS}s, got ${cursor}s`)

  const totalFrames = scenes.reduce((sum, scene) => sum + (scene.endSeconds - scene.startSeconds) * FPS, 0)
  assert(totalFrames === EXPECTED_FRAMES, `Total frames must equal ${EXPECTED_FRAMES}, got ${totalFrames}`)

  console.log('Scene timing is valid.')
  console.log(`Total scenes: ${scenes.length}`)
  console.log(`Total duration: ${cursor}s (${totalFrames} frames @ ${FPS}fps)`)

  for (const scene of scenes) {
    const duration = scene.endSeconds - scene.startSeconds
    console.log(`- ${scene.id.padEnd(24)} ${scene.startSeconds.toString().padStart(3)}-${scene.endSeconds.toString().padStart(3)}s (${duration}s)`)
  }
}

main()
