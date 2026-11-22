# Panel Noir ♟️

[![CI Pipeline](https://github.com/Kushal-ctrl-del/Panel-noir/actions/workflows/ci.yml/badge.svg)](https://github.com/Kushal-ctrl-del/Panel-noir/actions/workflows/ci.yml)
[![Tests Passing](https://img.shields.io/badge/tests-8%20passed-brightgreen.svg)](https://github.com/Kushal-ctrl-del/Panel-noir)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Groq LPU](https://img.shields.io/badge/Groq-Sub--Second%20Inference-f55036.svg)](https://groq.com/)
[![Track: Automation](https://img.shields.io/badge/Hack2skill%20Track-Automation%3A%20AI%20Agents-blue.svg)](https://hack2skill.com/)

> **Stress-test your ideas before the market does.**  
> An ultra-fast, multi-agent advisory system that ruthlessly evaluates pitches, startup ideas, and product decisions in sub-second time.

Built for the **Hack2skill Hackathon — Track 1: Automation (Build Intelligent AI Agents)**.

---

## 🏆 Hackathon Track Alignment: Automation — AI Agents

Panel Noir automates the expensive, slow, and biased advisory committee process. Instead of scheduling weeks of advisor meetings or focus groups, founders and builders trigger an **autonomous multi-agent consensus system**:

```mermaid
flowchart TD
    User["Founder / Builder Input (Pitch or Decision)"] --> Orchestrator["Agent Orchestrator (Next.js API)"]
    
    subgraph ParallelAgents ["Concurrent Agent Execution (Groq LPUs < 500ms)"]
        A1["Agent 1: The Cynical VC (Tier 1 Investor Lens)"]
        A2["Agent 2: The Bootstrapper (Capital Efficiency Lens)"]
        A3["Agent 3: The Power User (UX & Consumer Value Lens)"]
    end
    
    Orchestrator --> ParallelAgents
    ParallelAgents --> Moderator["Moderator & Consensus Engine"]
    Moderator --> Gate["Verdict Gate Breakdown (Against% / Mixed% / For%)"]
    Gate --> LiveDebate["Interactive Counter-Argument Loop"]
    LiveDebate -->|"User Defends Claims"| Orchestrator
```

### Key Agentic Capabilities:
1. **Multi-Agent Diversity:** Each agent reasons through a fundamentally different mathematical and domain filter (not just different tones).
2. **Consensus Arbitration:** A dedicated Moderator Meta-Agent digests all reactions and synthesizes a mathematical stance distribution with guaranteed 100% normalization ($Against + Mixed + For = 100\%$).
3. **Conversational Negotiation:** Users can argue back in multi-turn debate. Agents dynamically update their stances when presented with convincing evidence or push back harder on weak defenses.

---

## 💡 What is Panel Noir?

When you have a new startup idea, feature pitch, or critical business decision, getting unbiased, ruthless feedback is hard. Friends are polite, cofounders share your assumptions, and investors rarely provide transparent feedback.

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

## 💯 Hackathon Evaluation Matrix (100% Compliance)

| Evaluation Criteria | Implementation Details |
| :--- | :--- |
| **1. Problem Statement Alignment** | Fully aligns with **Automation: Build Intelligent AI Agents**. Automates multi-perspective due diligence, advisory reviews, and consensus generation with autonomous agents. |
| **2. Code Quality** | Strict TypeScript throughout. Clean modular architecture separating API endpoints (`app/api/`), business logic & schemas (`lib/`), and UI components (`components/`). `npm run lint` passes with 0 errors. |
| **3. Automated Testing** | Native automated test suite (`npm test`) with 8 comprehensive unit tests covering structured contracts, consensus math, stance normalization, and security boundaries. Full GitHub Actions CI automation. |
| **4. Accessibility (a11y)** | WCAG-compliant semantic HTML (`<main>`, `<header>`, `<label>`), explicit ARIA attributes on all inputs, progressbar semantics on the Verdict Gate, and `aria-live="polite"` dynamic announcement regions. |
| **5. Security** | Strict input boundary checks (capping payloads at 2000 chars to prevent prompt injection / buffer exhaustion). Complete server-side LLM isolation. Enterprise security headers configured in `next.config.mjs`. Zero secret leakage (`.env.local` gitignored). |
| **6. Efficiency & Performance** | Sub-second multi-agent concurrent inference (~450ms) via Groq LPUs. Parallel async orchestration with `Promise.all` ensures zero serial blocking. Next.js production bundle optimization. |

---

## ⚡ Performance Benchmarks

| Operation | Latency | Execution Model |
| :--- | :--- | :--- |
| **Panelist 1 (Power User)** | ~468ms | Concurrent LPU stream |
| **Panelist 2 (Bootstrapper)** | ~481ms | Concurrent LPU stream |
| **Panelist 3 (Cynical VC)** | ~489ms | Concurrent LPU stream |
| **Moderator Synthesis** | ~446ms | Real-time consensus arbiter |
| **Total Roundtrip Latency** | **< 1.0s** | Full 4-agent parallel pipeline |

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

### 3. Run Tests & Lint

```bash
npm test        # Runs automated test suite (8 tests, 0 failures)
npm run lint    # Runs TypeScript static verification
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Project Structure

```
panel-noir/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI pipeline (lint, test, build)
├── app/
│   ├── api/
│   │   ├── panel/route.ts       # Initial panel convening (parallel agent calls + moderator)
│   │   └── panel-reply/route.ts # Multi-turn debate route with conversational transcript
│   ├── layout.tsx               # Root layout, typography, and metadata
│   ├── page.tsx                 # Main UI with accessible landmarks & live debate
│   └── globals.css              # Noir theme tokens and base styles
├── components/
│   └── ShapeIcon.tsx            # SVG badge icons (circle, triangle, square)
├── lib/
│   ├── groq.ts                  # Groq client wrapper & model configuration
│   ├── panel-helpers.ts         # Persona calling logic, error catching, and token settings
│   ├── personas.ts              # Persona prompts, structured contracts, and moderator instructions
│   └── types.ts                 # TypeScript interfaces for panelist and verdict payloads
├── tests/
│   └── panel.test.js            # Automated test suite (contracts, normalization, security)
├── next.config.mjs              # Security headers (CSP, Frame-Options, Content-Type)
├── .env.local.example           # Environment template
└── package.json                 # Scripts and dependencies
```

---

## 🔒 Security & Privacy

- Never commit `.env.local` to source control. It is protected by `.gitignore`.
- All LLM interactions execute server-side in Next.js API routes (`/api/panel` and `/api/panel-reply`), ensuring credentials and system prompts remain completely confidential.
- Production headers include `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 📄 License

MIT License. Open innovation for all builders.
