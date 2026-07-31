import Groq from "groq-sdk";

// Server-side only — never import this from a client component.
// GROQ_API_KEY must be set in .env.local (see .env.local.example).

let client: Groq | null = null;

export function getGroqClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Copy .env.local.example to .env.local and add your key."
      );
    }
    client = new Groq({ apiKey });
  }
  return client;
}

// Llama 3.3 70B on Groq — good balance of speed and reasoning quality
// for short persona responses. Swap here if you want to try other
// Groq-hosted models (e.g. llama-3.1-8b-instant for even faster/cheaper).
export const GROQ_MODEL = "llama-3.3-70b-versatile";
