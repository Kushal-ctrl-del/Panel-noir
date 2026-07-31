import { NextRequest, NextResponse } from "next/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { PERSONAS, MODERATOR_SYSTEM_PROMPT, type PersonaId, type Stance } from "@/lib/personas";

export interface PanelistResponse {
  id: PersonaId;
  name: string;
  role: string;
  shape: string;
  text: string;
}

export interface PanelVerdict {
  against_pct: number;
  mixed_pct: number;
  for_pct: number;
  verdict: string;
  stances: Record<PersonaId, Stance>;
}

export interface PanelResult {
  panelists: PanelistResponse[];
  moderator: PanelVerdict;
}

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

    // Run all three personas in parallel — they don't need to see
    // each other's responses for this first pass, which keeps latency
    // low and avoids the personas just agreeing with whoever "spoke" first.
    const panelistCalls = PERSONAS.map(async (persona) => {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: persona.systemPrompt },
          { role: "user", content: topic },
        ],
        temperature: 0.8,
        max_tokens: 200,
      });

      const text = completion.choices[0]?.message?.content?.trim() ?? "";

      return {
        id: persona.id,
        name: persona.name,
        role: persona.role,
        shape: persona.shape,
        text,
      };
    });

    const panelists = await Promise.all(panelistCalls);

    // Moderator sees all three responses and produces the verdict split.
    const moderatorInput = panelists
      .map((p) => `${p.name}: ${p.text}`)
      .join("\n\n");

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
    let moderator: PanelVerdict;

    const VALID_STANCES: Stance[] = ["negative", "mixed", "positive"];
    const fallbackStances: Record<PersonaId, Stance> = {
      investor: "mixed",
      budget_founder: "mixed",
      early_adopter: "mixed",
    };

    try {
      const parsed = JSON.parse(moderatorRaw);
      // Guard against malformed percentages — fall back to a neutral
      // split rather than showing broken numbers in the UI.
      const against = Number(parsed.against_pct) || 0;
      const mixed = Number(parsed.mixed_pct) || 0;
      const forPct = Number(parsed.for_pct) || 0;
      const total = against + mixed + forPct;

      // Validate stances per-persona so one malformed entry doesn't
      // discard the other two — falls back to "mixed" per-id rather
      // than an all-or-nothing reject.
      const rawStances = parsed.stances || {};
      const stances = PERSONAS.reduce((acc, p) => {
        const val = rawStances[p.id];
        acc[p.id] = VALID_STANCES.includes(val) ? val : "mixed";
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
    } catch {
      // Moderator JSON failed to parse — degrade gracefully instead of
      // crashing the whole request. The panelist responses are still good.
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
