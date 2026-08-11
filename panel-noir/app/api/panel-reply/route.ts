import { NextRequest, NextResponse } from "next/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { PERSONAS, MODERATOR_SYSTEM_PROMPT, type PersonaId, type Stance } from "@/lib/personas";
import { callPersonaSafely, anyRateLimited } from "@/lib/panel-helpers";
import type { PanelVerdict, PanelResult } from "@/lib/types";

interface ReplyRequestBody {
  topic: string;
  // Full prior transcript so personas have context on what's already
  // been said — without this, each reply would ignore the discussion
  // so far and just re-react to the original topic.
  history: { speaker: string; text: string }[];
  userArgument: string;
}

export async function POST(req: NextRequest) {
  try {
    const { topic, history, userArgument }: ReplyRequestBody = await req.json();

    if (!userArgument || typeof userArgument !== "string" || userArgument.trim().length === 0) {
      return NextResponse.json({ error: "Say something to the panel first." }, { status: 400 });
    }

    const groq = getGroqClient();

    // Cap how much history each persona sees. An unbounded, growing
    // transcript is what caused the repetition bug: past a certain
    // length, the model starts pattern-matching its own earlier phrasing
    // instead of reasoning fresh, and produces near-identical responses
    // turn after turn. Keeping only the last N exchanges keeps the
    // context focused on what's actually still relevant to react to.
    const MAX_HISTORY_ENTRIES = 8;
    const recentHistory = history.slice(-MAX_HISTORY_ENTRIES);
    const trimmedNote =
      history.length > recentHistory.length
        ? `\n\n[Earlier discussion omitted — ${history.length - recentHistory.length} older messages not shown]`
        : "";

    // Build a shared transcript string so every persona call sees the
    // same recent context: original topic, the last few exchanges, then
    // the user's new argument they need to respond to.
    const transcript = [
      `Original idea under discussion: "${topic}"${trimmedNote}`,
      ...recentHistory.map((h) => `${h.speaker}: ${h.text}`),
      `You (the user, arguing your case): ${userArgument}`,
    ].join("\n\n");

    const panelistCalls = PERSONAS.map((persona) => {
      // Find this persona's own most recent statement so we can
      // explicitly instruct them not to just repeat it — a generic
      // "don't repeat yourself" instruction wasn't specific enough;
      // quoting their own last line back to them is.
      const ownLastStatement = [...recentHistory].reverse().find((h) => h.speaker === persona.name)?.text;

      const replySystemSuffix = `

You are now in a live back-and-forth. The user just argued a point directly to you and the other panelists.

Rules for this response:
- Respond specifically to what the user just said in their latest message — react to its actual content, not the conversation in general.
- Do NOT restate your previous position in the same words. ${ownLastStatement ? `Your own last statement was: "${ownLastStatement}" — say something genuinely new, not a rephrasing of that.` : ""}
- If the user's latest point actually resolves a concern you raised earlier, say so plainly and move the conversation forward (e.g. agree to specific terms, or ask a genuinely new question) — do not loop back to a question you already asked.
- If the conversation has converged on an agreement, acknowledge that concretely instead of re-litigating it.
- Keep it to 2-3 sentences.`;

      return callPersonaSafely(groq, persona, persona.systemPrompt + replySystemSuffix, transcript, {
        temperature: 0.75,
        frequencyPenalty: 0.6,
      });
    });

    const panelists = await Promise.all(panelistCalls);

    const allFailed = panelists.every((p) => p.failed);
    if (allFailed) {
      const rateLimited = anyRateLimited(panelists);
      return NextResponse.json(
        {
          error: rateLimited
            ? "Groq's rate limit was hit on every panelist. Wait a minute and try again."
            : "The panel couldn't respond. Try again.",
        },
        { status: rateLimited ? 429 : 500 }
      );
    }

    const usablePanelists = panelists.filter((p) => !p.failed);
    const moderatorInput = [
      `Original idea: "${topic}"`,
      `User's latest argument: "${userArgument}"`,
      ...usablePanelists.map(
        (p) =>
          `${p.name}: Take: "${p.take}". ${p.concern_or_praise ? `Concern/praise: "${p.concern_or_praise}".` : ""} ${p.question ? `Question: "${p.question}".` : ""}`
      ),
    ].join("\n\n");

    const VALID_STANCES: Stance[] = ["negative", "mixed", "positive"];
    const fallbackStances: Record<PersonaId, Stance> = {
      investor: "mixed",
      budget_founder: "mixed",
      early_adopter: "mixed",
    };
    let moderator: PanelVerdict;

    try {
      const moderatorCompletion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: MODERATOR_SYSTEM_PROMPT },
          { role: "user", content: moderatorInput },
        ],
        temperature: 0.3,
        max_tokens: 150,
        response_format: { type: "json_object" },
      });

      const moderatorRaw = moderatorCompletion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(moderatorRaw);
      const against = Number(parsed.against_pct) || 0;
      const mixed = Number(parsed.mixed_pct) || 0;
      const forPct = Number(parsed.for_pct) || 0;
      const total = against + mixed + forPct;

      const rawStances = parsed.stances || {};
      const stances = PERSONAS.reduce((acc, p) => {
        const wasFailed = panelists.find((pl) => pl.id === p.id)?.failed;
        const val = rawStances[p.id];
        acc[p.id] = wasFailed ? "mixed" : VALID_STANCES.includes(val) ? val : "mixed";
        return acc;
      }, {} as Record<PersonaId, Stance>);

      moderator =
        total > 0
          ? {
              against_pct: Math.round((against / total) * 100),
              mixed_pct: Math.round((mixed / total) * 100),
              for_pct: Math.round((forPct / total) * 100),
              verdict: String(parsed.verdict || "Mixed reaction from the panel"),
              stances,
            }
          : { against_pct: 33, mixed_pct: 34, for_pct: 33, verdict: "Panel split evenly", stances: fallbackStances };
    } catch (err) {
      console.error("Moderator step failed:", err);
      moderator = { against_pct: 33, mixed_pct: 34, for_pct: 33, verdict: "Verdict unavailable", stances: fallbackStances };
    }

    const result: PanelResult = { panelists, moderator };
    return NextResponse.json(result);
  } catch (err) {
    console.error("Panel reply API error:", err);
    return NextResponse.json({ error: "The panel couldn't respond. Try again." }, { status: 500 });
  }
}
