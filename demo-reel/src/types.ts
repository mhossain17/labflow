export interface VoiceoverScene {
  id: string
  section: 'problem' | 'solution' | 'demo' | 'adoption' | 'cta'
  title: string
  startSeconds: number
  endSeconds: number
  audioFile: string
  text: string
}

export interface SceneWithFrames extends VoiceoverScene {
  startFrame: number
  endFrame: number
  durationFrames: number
}
