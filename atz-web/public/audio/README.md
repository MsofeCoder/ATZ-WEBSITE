# Voice cues for the language toggle

Drop the two generated deep-male-voice MP3s here. The site references them by
these exact names (see `src/lib/lang-audio.ts`):

| File          | Plays when switching to | Script                        |
| ------------- | ----------------------- | ----------------------------- |
| `karibu.mp3`  | Swahili (SW)            | "KARIBU ATZ COMPANY LIMITED"  |
| `welcome.mp3` | English (EN)            | "WELCOME ATZ COMPANY LIMITED" |

Keep each clip under ~3 seconds: the language switch waits for the clip to
finish (capped at 3 s) before loading the other-language page.

Until the files exist the toggle works silently and, in development, logs a
reminder to the browser console.
