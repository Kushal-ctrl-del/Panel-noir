import Groq from "groq-sdk";
import { GROQ_MODEL } from "@/lib/groq";
import type { Persona, PersonaId } from "@/lib/personas";
import type { PanelistResponse } from "@/lib/types";

// Distinguishes a rate-limit failure from other errors so the UI can
// show a specific, actionable message instead of a generic one.
export class RateLimitError extends Error {
  constructor() {
    super("rate_limited");
    this.name = "RateLimitError";
  }
}

function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    return (err as { status?: number }).status === 429;
  }
  return false;
}

/**
 * Calls a single persona and never throws — on failure it returns a
 * placeholder response instead, so one persona's API error doesn't
 * take down the whole panel request. The placeholder is flagged with
 * failed: true so the UI can render it distinctly (e.g. a retry button)
 * rather than showing it as a real opinion.
 */
export async function callPersonaSafely(
  groq: Groq,
  persona: Persona,
  systemPromptOverride: string | undefined,
  userContent: string
): Promise<PanelistResponse & { failed?: boolean; rateLimited?: boolean }> {
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPromptOverride ?? persona.systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!text) {
      // Empty response from the model — treat as a soft failure rather
      // than showing a blank card.
      return {
        id: persona.id,
        name: persona.name,
        role: persona.role,
        shape: persona.shape,
        text: "",
        failed: true,
      };
    }

    return {
      id: persona.id,
      name: persona.name,
      role: persona.role,
      shape: persona.shape,
      text,
    };
  } catch (err) {
    const rateLimited = isRateLimitError(err);
    console.error(`Persona ${persona.id} failed:`, err);
    return {
      id: persona.id,
      name: persona.name,
      role: persona.role,
      shape: persona.shape,
      text: rateLimited
        ? "Rate limit hit — try again in a moment."
        : "This panelist couldn't respond right now.",
      failed: true,
      rateLimited,
    };
  }
}

export function anyRateLimited(
  results: { rateLimited?: boolean }[]
): boolean {
  return results.some((r) => r.rateLimited);
}
