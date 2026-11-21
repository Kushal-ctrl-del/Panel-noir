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

// Fast, high-quality reasoning and structured JSON output supported by Groq.
export const GROQ_MODEL = "qwen/qwen3.8-27b";
