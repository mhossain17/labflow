import rawScenes from '../../voiceover/script-scenes.json'
import { DURATION_SECONDS, FPS } from '../config'
import type { SceneWithFrames, VoiceoverScene } from '../types'

const scenes = rawScenes as VoiceoverScene[]

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function withFrames(input: VoiceoverScene[]): SceneWithFrames[] {
  assert(input.length > 0, 'No scenes defined in script-scenes.json')

  let cursor = 0
  const mapped = input.map((scene) => {
    assert(scene.startSeconds === cursor, `Scene ${scene.id} must start at ${cursor}`)
    assert(scene.endSeconds > scene.startSeconds, `Scene ${scene.id} must have positive duration`)

    const startFrame = scene.startSeconds * FPS
    const endFrame = scene.endSeconds * FPS
    cursor = scene.endSeconds

    return {
      ...scene,
      startFrame,
      endFrame,
      durationFrames: endFrame - startFrame,
    }
  })

  assert(cursor === DURATION_SECONDS, `Scene timeline must end at ${DURATION_SECONDS}s, got ${cursor}s`)
  return mapped
}

export const SCENE_SPECS = withFrames(scenes)
