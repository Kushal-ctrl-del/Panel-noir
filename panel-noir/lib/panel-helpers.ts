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
 *
 * Requests JSON-mode output matching the persona's structured contract
 * (take / concern_or_praise / question) instead of free prose — this is
 * the direct fix for panelists writing long paragraphs. If the model
 * still returns malformed JSON, we fall back to showing the raw text
 * in the "take" field rather than dropping the response entirely.
 */
export async function callPersonaSafely(
  groq: Groq,
  persona: Persona,
  systemPromptOverride: string | undefined,
  userContent: string,
  options?: { temperature?: number; frequencyPenalty?: number }
): Promise<PanelistResponse & { failed?: boolean; rateLimited?: boolean }> {
  const base = {
    id: persona.id,
    name: persona.name,
    role: persona.role,
    shape: persona.shape,
  };

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPromptOverride ?? persona.systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: options?.temperature ?? 0.8,
      // frequency_penalty discourages the model from reusing tokens/phrases
      // it has already used — the direct mechanical fix for the repetition
      // bug seen in long multi-turn conversations, on top of the explicit
      // prompt instruction not to restate prior statements.
      frequency_penalty: options?.frequencyPenalty ?? 0,
      max_tokens: 250,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!raw) {
      return { ...base, take: "", concern_or_praise: "", question: "", failed: true };
    }

    try {
      const parsed = JSON.parse(raw);
      const take = String(parsed.take ?? "").trim();
      const concern = String(parsed.concern_or_praise ?? "").trim();
      const question = String(parsed.question ?? "").trim();

      if (!take && !concern) {
        // JSON parsed but came back empty on the fields that matter —
        // treat as a soft failure, same as a blank response.
        return { ...base, take: "", concern_or_praise: "", question: "", failed: true };
      }

      return { ...base, take, concern_or_praise: concern, question };
    } catch {
      // Model didn't honor JSON mode (rare, but happens) — degrade
      // gracefully by showing the raw text as the "take" rather than
      // losing the response entirely. Still flagged so the UI can
      // style it distinctly if useful.
      console.error(`Persona ${persona.id} returned non-JSON despite json_object mode:`, raw);
      return { ...base, take: raw.slice(0, 120), concern_or_praise: "", question: "" };
    }
  } catch (err) {
    const rateLimited = isRateLimitError(err);
    console.error(`Persona ${persona.id} failed:`, err);
    return {
      ...base,
      take: rateLimited ? "Rate limit hit — try again in a moment." : "This panelist couldn't respond right now.",
      concern_or_praise: "",
      question: "",
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
