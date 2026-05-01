import { Composition } from 'remotion'
import { DemoReel } from './compositions/DemoReel'
import { DURATION_FRAMES, FPS } from './config'

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="LabFlowDemoReel16x9"
        component={DemoReel}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          aspect: 'landscape',
          withVoiceover: false,
        }}
      />

      <Composition
        id="LabFlowDemoReel9x16"
        component={DemoReel}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          aspect: 'portrait',
          withVoiceover: false,
        }}
      />
    </>
  )
}
