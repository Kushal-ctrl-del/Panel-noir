import type { PersonaId, Stance } from "@/lib/personas";

export interface PanelistResponse {
  id: PersonaId;
  name: string;
  role: string;
  shape: string;
  text: string;
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
