# Panel Noir ♟️

> **Stress-test your ideas before the market does.**  
> An ultra-fast, multi-agent advisory panel that ruthlessly evaluates pitches, startup ideas, and product decisions in sub-second time.

Built with **Next.js 14** and powered by **Groq LPUs** for near-instant inference.

---

## 💡 What is Panel Noir?

When you have a new startup idea, feature pitch, or critical business decision, getting unbiased, ruthless feedback is hard. Friends are polite, cofounders share your assumptions, and investors won't tell you the real reason they passed.

**Panel Noir** convenes an instant advisory board of three contrasting AI personas to critique, question, and debate your idea from completely different angles—concluding with a synthesized consensus verdict. If you disagree with their feedback, you can step into the arena and **argue back**, defending your assumptions in real-time to see if you can change their minds.

---

## 🎯 How It Helps

| Who It's For | How Panel Noir Helps |
| :--- | :--- |
| **Founders & Pitchers** | Rehearse tough questions, expose unexamined unit economics, and fix weak points before talking to real investors. |
| **Product Managers** | Pressure-test feature PRDs, find adoption friction, and anticipate user skepticism before building. |
| **Indie Hackers & Solopreneurs** | Acts as an on-demand sounding board and advisory panel for solo builders who lack a team to poke holes in their plans. |
| **Developers & Tech Leads** | Vet architectural decisions, migrations, and tech-stack choices against realistic constraints. |

---

## 👥 The Panelists

Each panelist operates with a dedicated persona prompt engineered around how they *reason*, not just how they talk:

1. **The Cynical VC** 🔺
   - *Perspective:* Tier-1 investor focused on market size, defensive moats, CAC/LTV, enterprise viability, and exit potential.
   - *Filter:* Skeptical of "features pretending to be companies" and crowded graveyards.

2. **The Bootstrapper** ⏹️
   - *Perspective:* Self-funded, profitable founder who values lean burn, immediate cash flow, organic distribution, and high retention.
   - *Filter:* Skeptical of ideas requiring venture capital, massive upfront infra, or complex sales cycles.

3. **The Power User** ⚪
   - *Perspective:* Discerning early adopter, consumer champion, and UX critic.
   - *Filter:* Skeptical of gimmicky AI features, user fatigue, broken workflows, and poor data privacy.

4. **The Synthesizer (Moderator)** ⚖️
   - Listens to all three panelists and generates a unified consensus breakdown (`Against %`, `Mixed %`, `For %`) and a 1–2 sentence bottom-line verdict.

---

## ⚡ Key Features

- **Blazing Fast (Groq LPUs):** Leverages Groq's high-throughput LPU engine for sub-second, parallel persona generation.
- **Structured JSON Contracts:** Enforces strict length, tone, and analytical contracts so reactions remain punchy, concrete, and grounded in specific numbers or details.
- **Live Debate & Contextual Memory:** Don't like the verdict? Reply with your counter-arguments. The panelists re-evaluate your claims with full conversation memory, and the verdict gate dynamically recalculates.
- **Guaranteed Stance Consistency:** The verdict split and individual card badges (Negative / Mixed / Positive) derive from a single unified moderator judgment, preventing contradictory states.
- **Noir Aesthetic:** Minimalist monochrome design, numbered cards, staggered entrance keyframes, and crisp monospace typography.

---

## 🚀 Quickstart

### 1. Clone & Install

```bash
git clone https://github.com/Kushal-ctrl-del/Panel-noir.git
cd Panel-noir
npm install
```

### 2. Configure Environment

1. Obtain a free Groq API key from [Groq Console](https://console.groq.com/keys).
2. Create your `.env.local` file:

```bash
cp .env.local.example .env.local
```

3. Open `.env.local` and add your key:

```env
GROQ_API_KEY=gsk_your_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Project Structure

```
panel-noir/
├── app/
│   ├── api/
│   │   ├── panel/route.ts       # Initial panel convening (parallel persona calls + moderator)
│   │   └── panel-reply/route.ts # Multi-turn debate route with full conversational transcript
│   ├── layout.tsx               # Root layout, fonts, and metadata
│   ├── page.tsx                 # Main UI with debate thread, cards, and animations
│   └── globals.css              # Theme tokens and global styling
├── components/
│   └── ShapeIcon.tsx            # SVG badge icons (circle, triangle, square)
├── lib/
│   ├── groq.ts                  # Groq client initialization and model config
│   ├── panel-helpers.ts         # Persona calling logic, error catching, and token settings
│   ├── personas.ts              # Persona prompts, structured contracts, and moderator instructions
│   └── types.ts                 # TypeScript interfaces for panelist and verdict payloads
├── .env.local.example           # Example environment template
└── package.json                 # Scripts and dependencies
```

---

## ⚙️ Customizing Personas

You can easily adapt the panel to your specific domain (e.g., adding a Security Auditor, Legal Counsel, or Chief Marketing Officer) by editing [`lib/personas.ts`](file:///D:/panel-noir%20(1)/panel-noir/lib/personas.ts):

```typescript
export const PERSONAS: Persona[] = [
  {
    id: "security_lead",
    name: "The Paranoid CISO",
    role: "SOC2 Compliance & Vulnerability Hunter",
    shape: "triangle",
    prompt: "You are a ruthless enterprise CISO. Scrutinize data exposure, attack surfaces, and third-party API dependencies..."
  },
  // ...
];
```

---

## 🔒 Security

- Never commit `.env.local` to source control. It is protected by `.gitignore`.
- All LLM interactions execute server-side in Next.js API routes (`/api/panel` and `/api/panel-reply`), ensuring credentials and system prompts remain completely confidential.

---

## 📄 License

MIT License. Feel free to use, modify, and build upon this project.
