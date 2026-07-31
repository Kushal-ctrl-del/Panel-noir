# The Panel

Describe an idea, pitch, or decision — a panel of three distinct AI personas reacts and argues about it, with a live verdict on where they land.

Built with Next.js 14 + Groq (Llama 3.3 70B). No local models, no Termux, no special hardware — runs entirely on cloud API calls.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Get a free Groq API key at https://console.groq.com/keys

3. Copy the env example and add your key:
   ```
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` and paste your key in place of `your_groq_api_key_here`.

4. Run the dev server:
   ```
   npm run dev
   ```

5. Open http://localhost:3000

## Project structure

```
panel-noir/
├── app/
│   ├── api/panel/route.ts       → API route: initial panel run (3 personas + moderator)
│   ├── api/panel-reply/route.ts → API route: your reply to the panel, with full conversation context
│   ├── layout.tsx               → root layout, fonts
│   ├── page.tsx                 → main UI (Panel Noir design), including the reply/argue flow
│   └── globals.css              → design tokens (colors, base styles)
├── components/
│   └── ShapeIcon.tsx        → circle/triangle/square badge icons
├── lib/
│   ├── personas.ts           → the 3 persona system prompts + moderator prompt
│   ├── panel-helpers.ts      → safe per-persona API caller (failure/rate-limit isolation)
│   ├── types.ts              → shared response types
│   └── groq.ts               → Groq API client wrapper
├── .env.local.example       → copy to .env.local and add your key
└── package.json
```

## How it works

1. You type an idea into the textarea and click "Convene the panel."
2. The API route (`app/api/panel/route.ts`) sends your idea to all three personas **in parallel** — each with a distinct system prompt (see `lib/personas.ts`) so they reason from genuinely different angles, not just different tones.
3. Once all three respond, a fourth "moderator" call reads all three responses and produces a percentage split (against / mixed / for), a stance per panelist (negative/mixed/positive), and a short verdict line — this becomes the "verdict gate" bar and the per-panelist status tags. Both come from the same moderator judgment, so they can't contradict each other.
4. Everything renders in the Panel Noir visual style — numbered players, shape badges, status tags, monospace type.

### Arguing back

Once the panel has spoken, a "Log" section shows the running transcript, and an input below it lets you argue your case directly. Submitting:
- Sends your argument plus the full conversation so far to `app/api/panel-reply/route.ts`.
- Each persona responds **specifically to your argument** (not a generic re-reaction) — they can concede a point if you addressed their concern, or push back further if you didn't.
- The moderator re-runs its stance/verdict judgment against the updated conversation, so the verdict gate updates live as you go back and forth.
- The transcript keeps growing, so a third or fourth reply still has full context of everything said before it.

## Editing the personas

Want different panelists (e.g. a technical cofounder instead of an early adopter)? Edit `lib/personas.ts` — each persona just needs a `name`, `role`, `shape` (circle/triangle/square), and a `systemPrompt` describing their lens. Keep prompts specific about *how they reason*, not just *what tone to use* — that's what keeps responses from blurring together.

## Reliability notes

- **Per-persona failure isolation** (`lib/panel-helpers.ts`) — if one panelist's API call fails (rate limit, timeout, empty response), the other two still render normally. The failed panelist shows a distinct "no response" or "rate limited" card instead of taking down the whole request. Only if *all three* fail does the request return an error.
- **Rate-limit-specific messaging** — a 429 from Groq surfaces as "rate limit hit, wait a minute" rather than a generic error, both per-panelist and at the top level if every call gets rate limited.
- **Per-panelist skeleton loading** — while the initial panel is convening, each panelist shows its own pulsing skeleton card (staggered animation delay) instead of one blanket spinner, so it reads as three independent responses coming in rather than one blocked operation.
- **Verdict bar overflow guard** — percentage labels inside the bar hide themselves below 12% width (to avoid clipped text) and a legend row below the bar always shows the exact numbers regardless of segment size.
- **Basic mobile tightening** — header padding and the player-count label adjust under 480px width.
