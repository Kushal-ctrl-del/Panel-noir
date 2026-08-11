import type { PersonaId, Stance } from "@/lib/personas";

export interface PanelistResponse {
  id: PersonaId;
  name: string;
  role: string;
  shape: string;
  // Structured fields replacing free prose — forces the model into a
  // scannable format instead of paragraph answers, and lets the UI
  // render each field as its own labeled element.
  take: string;
  concern_or_praise: string;
  question: string;
  failed?: boolean;
  rateLimited?: boolean;
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