# LabFlow Demo Reel (Remotion)

Standalone 3-minute demo reel for LabFlow targeting administrators and teachers.

## Compositions
- `LabFlowDemoReel16x9` - `1920x1080`, `30fps`, `5400` frames (exactly 3:00)
- `LabFlowDemoReel9x16` - `1080x1920`, `30fps`, `5400` frames (exactly 3:00)

Both compositions share the same scene timing from `voiceover/script-scenes.json`.

## Requirements covered
- Problem framing: downtime + visibility gap
- What was built and value proposition
- Product demo in action (teacher, student, monitor, analytics)
- Adoption plan (30-day pilot)
- CTA: `Try the demo now` -> `/demo/try`

## Commands
From repository root:

```bash
npm run demo-reel:preview
npm run demo-reel:voiceover
npm run demo-reel:render:16x9
npm run demo-reel:render:9x16
npm run demo-reel:render:16x9:voice
npm run demo-reel:render:9x16:voice
```

Or from `demo-reel/` directly:

```bash
npm run preview
npm run voiceover
npm run render:16x9
npm run render:9x16
npm run render:16x9:voice
npm run render:9x16:voice
npm run validate
```

`render:16x9` and `render:9x16` are safe defaults (no required audio files).  
Use `:voice` variants after generating ElevenLabs audio files.

## Voiceover
- Canonical script: `voiceover/script-full.md`
- Scene timing and chunked text: `voiceover/script-scenes.json`
- ElevenLabs generation script: `scripts/generate-voiceover.ts`
- Output audio directory: `public/voiceover/audio/`

Voice profile target:
- Male
- Neutral New Yorker accent
- Calm pace
- Neutral third-person narration
