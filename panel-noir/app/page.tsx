"use client";

import { useState } from "react";
import { ShapeIcon } from "@/components/ShapeIcon";
import type { PanelResult } from "@/app/api/panel/route";

const SHAPE_COLORS: Record<string, string> = {
  triangle: "#FF2E7E",
  square: "#E0B84D",
  circle: "#00C2A8",
};

// Static display info matching lib/personas.ts, used only to render
// per-panelist skeleton cards before the real API response arrives —
// keeps the loading state feeling alive instead of one generic spinner.
const PANELIST_META = [
  { id: "investor", name: "Skeptical investor", role: "Cares about the numbers", shape: "triangle" },
  { id: "budget_founder", name: "Budget-conscious founder", role: "Wants predictable cost", shape: "square" },
  { id: "early_adopter", name: "Early adopter", role: "Wants proof before committing", shape: "circle" },
];

// Stance per panelist now comes directly from the moderator's single
// LLM call (see app/api/panel/route.ts) — this guarantees the status
// tags and the verdict gate percentages can never contradict each
// other, since they're both derived from the same judgment.

export default function Home() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PanelResult | null>(null);
  // Running transcript of everything said, in order — sent as context
  // on every reply so personas respond to the actual conversation,
  // not just the original topic in isolation.
  const [history, setHistory] = useState<{ speaker: string; text: string }[]>([]);
  const [userArgument, setUserArgument] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  async function runPanel() {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/panel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong.");
      }

      const data: PanelResult = await res.json();
      setResult(data);
      setHistory(data.panelists.map((p) => ({ speaker: p.name, text: p.text })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The panel couldn't convene. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    if (!userArgument.trim() || replyLoading || !result) return;
    setReplyLoading(true);
    setError(null);

    const argument = userArgument;

    try {
      const res = await fetch("/api/panel-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, history, userArgument: argument }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong.");
      }

      const data: PanelResult = await res.json();
      setResult(data);
      // Append the user's argument, then the new panelist responses,
      // onto the running transcript — this is what gives the next
      // reply real conversational context.
      setHistory((prev) => [
        ...prev,
        { speaker: "You", text: argument },
        ...data.panelists.map((p) => ({ speaker: p.name, text: p.text })),
      ]);
      setUserArgument("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The panel couldn't respond. Try again.");
    } finally {
      setReplyLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 90 }}>
      <header
        className="panel-header"
        style={{
          background: "var(--pink)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="7" fill="#0D0D0D" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <polygon points="8,1 15,14 1,14" fill="#0D0D0D" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <rect x="1" y="1" width="14" height="14" fill="#0D0D0D" />
          </svg>
          <span
            style={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "0.14em",
              color: "var(--void)",
              textTransform: "uppercase",
            }}
          >
            The panel
          </span>
        </div>
        <span
          className="panel-header-count"
          style={{
            fontSize: 11,
            color: "var(--void)",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          003 players
        </span>
      </header>

      <main style={{ padding: "36px 24px 0" }}>
        <div
          style={{
            fontSize: 11,
            color: "var(--dim)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 14,
            fontWeight: 700,
          }}
        >
          Bring an idea
        </div>

        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Describe the idea, pitch, or decision you want the panel to react to..."
          rows={3}
          style={{
            width: "100%",
            background: "var(--void-raised)",
            border: "1px solid var(--line)",
            color: "var(--paper)",
            fontFamily: "inherit",
            fontSize: 13,
            padding: 16,
            resize: "vertical",
            marginBottom: 12,
          }}
        />

        <button
          onClick={runPanel}
          disabled={loading || !topic.trim()}
          style={{
            background: loading ? "var(--line)" : "var(--pink)",
            color: loading ? "var(--dim)" : "var(--void)",
            border: "none",
            padding: "14px 26px",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          {loading ? "Panel is deliberating..." : "Convene the panel"}
        </button>

        {error && (
          <div
            style={{
              border: "1px solid var(--pink)",
              background: "var(--pink-dim)",
              color: "var(--pink)",
              padding: "14px 16px",
              fontSize: 12,
              marginBottom: 32,
            }}
          >
            {error}
          </div>
        )}

        {loading && !result && (
          <>
            <SectionTag label="Players" />
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 44 }}>
              {PANELIST_META.map((meta, i) => (
                <SkeletonCard key={meta.id} meta={meta} index={i} />
              ))}
            </div>
          </>
        )}

        {result && (
          <>
            <SectionTag label="Players" />
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 44 }}>
              {result.panelists.map((p, i) => {
                const lean = result.moderator.stances[p.id];
                const color = SHAPE_COLORS[p.shape] || "#FFFFFF";
                return (
                  <div
                    key={p.id}
                    style={{
                      background: "var(--void-raised)",
                      border: p.failed ? "1px dashed var(--line)" : "1px solid var(--line)",
                      padding: 20,
                      position: "relative",
                      opacity: p.failed ? 0.7 : 1,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 20,
                        right: 20,
                        fontFamily: "Archivo, sans-serif",
                        fontSize: 34,
                        fontWeight: 800,
                        color: "var(--line)",
                        lineHeight: 1,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <ShapeIcon shape={p.shape} color={p.failed ? "var(--dim)" : color} />
                      <div>
                        <div
                          style={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: 14,
                            textTransform: "uppercase",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {p.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--dim)" }}>{p.role}</div>
                      </div>
                    </div>
                    {p.failed ? (
                      <div
                        style={{
                          display: "inline-block",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "4px 10px",
                          marginBottom: 12,
                          background: "var(--line)",
                          color: "var(--dim)",
                        }}
                      >
                        {p.rateLimited ? "Rate limited" : "No response"}
                      </div>
                    ) : (
                      <StatusTag lean={lean} />
                    )}
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: p.failed ? "var(--dim)" : "#C8C8C8", maxWidth: 520 }}>
                      {p.failed ? p.text || "This panelist didn't respond — the others still weighed in." : p.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                border: "1px solid var(--line)",
                background: "var(--void-raised)",
                padding: "28px 24px",
                marginBottom: 44,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--dim)",
                  marginBottom: 16,
                  fontWeight: 700,
                }}
              >
                Verdict gate
              </div>
              <div style={{ display: "flex", height: 28, border: "1px solid var(--line)", marginBottom: 10, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${result.moderator.against_pct}%`,
                    background: "var(--pink-dim)",
                    color: "var(--pink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {result.moderator.against_pct >= 12 ? `${result.moderator.against_pct}%` : ""}
                </div>
                <div
                  style={{
                    width: `${result.moderator.mixed_pct}%`,
                    background: "var(--amber-dim)",
                    color: "var(--amber)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {result.moderator.mixed_pct >= 12 ? `${result.moderator.mixed_pct}%` : ""}
                </div>
                <div
                  style={{
                    width: `${result.moderator.for_pct}%`,
                    background: "var(--teal-dim)",
                    color: "var(--teal)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {result.moderator.for_pct >= 12 ? `${result.moderator.for_pct}%` : ""}
                </div>
              </div>
              {/* Legend below the bar guarantees every percentage is
                  readable even when a segment is too narrow to hold
                  its own label — the bar above hides labels under 12%
                  to avoid clipped/overflowing text on small screens. */}
              <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 10, color: "var(--dim)", flexWrap: "wrap" }}>
                <span>Against — {result.moderator.against_pct}%</span>
                <span>Mixed — {result.moderator.mixed_pct}%</span>
                <span>For — {result.moderator.for_pct}%</span>
              </div>
              <div style={{ fontFamily: "Archivo, sans-serif", fontSize: 16, fontWeight: 800 }}>
                {result.moderator.verdict}
              </div>
            </div>

            <SectionTag label="Log" />
            <div style={{ marginBottom: 40 }}>
              {history.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px 1fr",
                    gap: 14,
                    padding: "14px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: 11,
                      color: entry.speaker === "You" ? "var(--pink)" : "var(--dim)",
                      textTransform: "uppercase",
                    }}
                  >
                    {entry.speaker === "You" ? "You" : entry.speaker.split(" ")[0]}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: "#C8C8C8" }}>{entry.text}</div>
                </div>
              ))}
            </div>

            <SectionTag label="Argue your case" />
            <textarea
              value={userArgument}
              onChange={(e) => setUserArgument(e.target.value)}
              placeholder="Push back on the panel, add missing context, or defend your idea..."
              rows={2}
              style={{
                width: "100%",
                background: "var(--void-raised)",
                border: "1px solid var(--line)",
                color: "var(--paper)",
                fontFamily: "inherit",
                fontSize: 13,
                padding: 16,
                resize: "vertical",
                marginBottom: 12,
              }}
            />
            <button
              onClick={sendReply}
              disabled={replyLoading || !userArgument.trim()}
              style={{
                background: replyLoading ? "var(--line)" : "var(--teal)",
                color: replyLoading ? "var(--dim)" : "var(--void)",
                border: "none",
                padding: "14px 26px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {replyLoading ? "Panel is reconsidering..." : "Submit to the panel"}
            </button>
          </>
        )}
      </main>
    </div>
  );
}

function SkeletonCard({
  meta,
  index,
}: {
  meta: { id: string; name: string; role: string; shape: string };
  index: number;
}) {
  const color = SHAPE_COLORS[meta.shape] || "#FFFFFF";
  return (
    <div
      style={{
        background: "var(--void-raised)",
        border: "1px solid var(--line)",
        padding: 20,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <ShapeIcon shape={meta.shape} color={color} />
        <div>
          <div
            style={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
            }}
          >
            {meta.name}
          </div>
          <div style={{ fontSize: 11, color: "var(--dim)" }}>{meta.role}</div>
        </div>
      </div>
      {/* Staggered pulse bars stand in for the response text — the
          animation-delay offset per index gives the impression each
          panelist is "thinking" independently rather than one blob
          loading all at once. */}
      <div
        style={{
          height: 12,
          width: "90%",
          background: "var(--line)",
          marginBottom: 8,
          animation: "pulse 1.4s ease-in-out infinite",
          animationDelay: `${index * 0.2}s`,
        }}
      />
      <div
        style={{
          height: 12,
          width: "60%",
          background: "var(--line)",
          animation: "pulse 1.4s ease-in-out infinite",
          animationDelay: `${index * 0.2 + 0.1}s`,
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

function SectionTag({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{ width: 20, height: 2, background: "var(--pink)" }} />
      <span
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--dim)",
          fontWeight: 700,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function StatusTag({ lean }: { lean: "negative" | "mixed" | "positive" }) {
  const map = {
    negative: { label: "Eliminated the idea", bg: "var(--pink-dim)", fg: "var(--pink)" },
    mixed: { label: "Holding vote", bg: "var(--amber-dim)", fg: "var(--amber)" },
    positive: { label: "Survives", bg: "var(--teal-dim)", fg: "var(--teal)" },
  };
  const s = map[lean];
  return (
    <div
      style={{
        display: "inline-block",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        padding: "4px 10px",
        marginBottom: 12,
        background: s.bg,
        color: s.fg,
      }}
    >
      {s.label}
    </div>
  );
}
