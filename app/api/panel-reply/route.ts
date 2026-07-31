import { NextRequest, NextResponse } from "next/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { PERSONAS, MODERATOR_SYSTEM_PROMPT, type PersonaId, type Stance } from "@/lib/personas";
import type { PanelistResponse, PanelVerdict, PanelResult } from "@/app/api/panel/route";

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

    // Build a shared transcript string so every persona call sees the
    // same context: original topic, everything said so far, then the
    // user's new argument they need to respond to.
    const transcript = [
      `Original idea under discussion: "${topic}"`,
      ...history.map((h) => `${h.speaker}: ${h.text}`),
      `You (the user, arguing your case): ${userArgument}`,
    ].join("\n\n");

    const panelistCalls = PERSONAS.map(async (persona) => {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content:
              persona.systemPrompt +
              `\n\nYou are now in a live back-and-forth. The user just argued a point directly to you and the other panelists. Respond specifically to what they just said — reference their actual argument, don't just repeat your original stance. You can change your mind if their point genuinely addresses your concern, or push back further if it doesn't.`,
          },
          { role: "user", content: transcript },
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
      } as PanelistResponse;
    });

    const panelists = await Promise.all(panelistCalls);

    const moderatorInput = [
      `Original idea: "${topic}"`,
      `User's latest argument: "${userArgument}"`,
      ...panelists.map((p) => `${p.name}: ${p.text}`),
    ].join("\n\n");

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
    const VALID_STANCES: Stance[] = ["negative", "mixed", "positive"];
    const fallbackStances: Record<PersonaId, Stance> = {
      investor: "mixed",
      budget_founder: "mixed",
      early_adopter: "mixed",
    };
    let moderator: PanelVerdict;

    try {
      const parsed = JSON.parse(moderatorRaw);
      const against = Number(parsed.against_pct) || 0;
      const mixed = Number(parsed.mixed_pct) || 0;
      const forPct = Number(parsed.for_pct) || 0;
      const total = against + mixed + forPct;

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
      moderator = { against_pct: 33, mixed_pct: 34, for_pct: 33, verdict: "Verdict unavailable", stances: fallbackStances };
    }

    const result: PanelResult = { panelists, moderator };
    return NextResponse.json(result);
  } catch (err) {
    console.error("Panel reply API error:", err);
    return NextResponse.json({ error: "The panel couldn't respond. Try again." }, { status: 500 });
  }
}
