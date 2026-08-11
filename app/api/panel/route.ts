import { NextRequest, NextResponse } from "next/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { PERSONAS, MODERATOR_SYSTEM_PROMPT, type PersonaId, type Stance } from "@/lib/personas";
import { callPersonaSafely, anyRateLimited } from "@/lib/panel-helpers";
import type { PanelResult, PanelVerdict } from "@/lib/types";

export type { PanelistResponse, PanelVerdict, PanelResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json(
        { error: "Give the panel something to react to." },
        { status: 400 }
      );
    }

    const groq = getGroqClient();

    const panelistCalls = PERSONAS.map((persona) =>
      callPersonaSafely(groq, persona, undefined, topic)
    );

    const panelists = await Promise.all(panelistCalls);

    const allFailed = panelists.every((p) => p.failed);
    if (allFailed) {
      const rateLimited = anyRateLimited(panelists);
      return NextResponse.json(
        {
          error: rateLimited
            ? "Groq's rate limit was hit on every panelist. Wait a minute and try again."
            : "The panel couldn't convene. Try again.",
        },
        { status: rateLimited ? 429 : 500 }
      );
    }

    const usablePanelists = panelists.filter((p) => !p.failed);
    const moderatorInput = usablePanelists
      .map(
        (p) =>
          `${p.name}: Take: "${p.take}". ${p.concern_or_praise ? `Concern/praise: "${p.concern_or_praise}".` : ""} ${p.question ? `Question: "${p.question}".` : ""}`
      )
      .join("\n\n");

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
          { role: "user", content: `Idea: "${topic}"\n\nPanel responses:\n${moderatorInput}` },
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
    console.error("Panel API error:", err);
    return NextResponse.json(
      { error: "The panel couldn't convene. Try again." },
      { status: 500 }
    );
  }
}