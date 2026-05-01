# Voiceover Pipeline

This folder contains the canonical script and scene timing used by both:
- Remotion compositions (`src/data/sceneSpec.ts` imports `script-scenes.json`)
- ElevenLabs generation (`scripts/generate-voiceover.ts`)

## Voice Direction Metadata
- Persona: Male narrator
- Accent: Neutral New Yorker
- Pace: Calm
- Perspective: Neutral third-person
- Tone: Hybrid (administrator-facing + teacher-practical)

## Files
- `script-scenes.json`: Source of truth for timing, text, and audio filenames
- `script-full.md`: Human-readable master script
- Generated audio outputs: `../public/voiceover/audio/*.mp3`

## Generate Audio
From `demo-reel/`:

```bash
npm run voiceover
```

Environment variables are loaded from `.env`.
