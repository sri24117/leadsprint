"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";

type CallItem = {
  id: string;
  leadName: string;
  phone: string;
  duration: string;
  sentiment: "Positive" | "Neutral" | "Hesitant";
  engine: "bolna" | "vapi" | "mock";
  outcome: string;
  summary: string;
  startedAt: string;
  transcript: Array<{ role: string; text: string }>;
};

const mockCalls: CallItem[] = [
  {
    id: "call-1",
    leadName: "Vijay",
    phone: "+919381948625",
    duration: "3m 48s",
    sentiment: "Positive",
    engine: "bolna",
    outcome: "Qualified - Site Visit Booked",
    summary: "Lead expressed strong interest in 3BHK Kondapur flat with 75L-95L budget. Booked site visit for Saturday 11 AM.",
    startedAt: "10 mins ago",
    transcript: [
      { role: "AI Agent", text: "Namaste Vijay garu, Hyderabad Prime Realty nundi. Mee budget range entha untundi?" },
      { role: "Vijay", text: "Na budget 75 to 95 lakhs madhya undi. Kondapur side prefer chestanu." },
      { role: "AI Agent", text: "Kondapur lo mana 3BHK Gated community site visit Saturday plan cheddama?" },
      { role: "Vijay", text: "Ha sure, Saturday morning 11 AM ki plan cheyandi." }
    ]
  },
  {
    id: "call-2",
    leadName: "Pradeep Sharma",
    phone: "+919876543210",
    duration: "2m 15s",
    sentiment: "Neutral",
    engine: "bolna",
    outcome: "Follow-up Required",
    summary: "Lead inquired about 2BHK options in Kondapur. Requested brochure before confirming visit.",
    startedAt: "45 mins ago",
    transcript: [
      { role: "AI Agent", text: "Namaste Pradeep, Hyderabad Prime Realty. Are you looking for 2BHK or 3BHK?" },
      { role: "Pradeep", text: "2BHK for now. Please send the brochure on WhatsApp first." }
    ]
  }
];

export default function CallsPage() {
  const [calls] = useState<CallItem[]>(mockCalls);
  const [selectedCall, setSelectedCall] = useState<CallItem | null>(mockCalls[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <AppLayout pageTitle="AI Call Center Logs">
      {/* Call KPI Summary Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="glass-card">
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>TODAY'S CALLS</span>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--teal-primary)" }}>86</div>
        </div>
        <div className="glass-card">
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>AI ANSWERED</span>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--green-success)" }}>80</div>
        </div>
        <div className="glass-card">
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>TRANSFERRED TO HUMAN</span>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--amber-warning)" }}>6</div>
        </div>
        <div className="glass-card">
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>AVG DURATION</span>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--teal-dark)" }}>3m 02s</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(340px, 1fr)", gap: 20 }}>
        {/* Call Cards List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {calls.map((call) => {
            const isSelected = selectedCall?.id === call.id;
            return (
              <div
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className="glass-card"
                style={{
                  cursor: "pointer",
                  borderLeft: `4px solid ${call.sentiment === "Positive" ? "var(--green-success)" : "var(--amber-warning)"}`,
                  background: isSelected ? "var(--teal-light)" : "var(--surface)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{call.leadName}</h3>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{call.phone} • {call.startedAt}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: call.sentiment === "Positive" ? "rgba(22,163,74,0.15)" : "rgba(245,158,11,0.15)", color: call.sentiment === "Positive" ? "var(--green-success)" : "var(--amber-warning)" }}>
                      {call.sentiment}
                    </span>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Duration: {call.duration}</div>
                  </div>
                </div>

                <div style={{ fontSize: 13, color: "var(--text)", marginTop: 10 }}>
                  <strong>Summary:</strong> {call.summary}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Call Detail Drawer & Audio Player */}
        {selectedCall && (
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{selectedCall.leadName}</h2>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{selectedCall.phone} • Engine: {selectedCall.engine.toUpperCase()}</span>
            </div>

            {/* Audio Waveform Player Simulation */}
            <div style={{ padding: 16, borderRadius: 10, background: "var(--surface-2)", display: "flex", alignItems: "center", gap: 14 }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="btn-primary"
                style={{ width: 44, height: 44, borderRadius: "50%", padding: 0, justifyContent: "center" }}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>
                  {isPlaying ? "Playing recording..." : "Audio Recording Available"}
                </div>
                <div style={{ height: 20, display: "flex", alignItems: "center", gap: 3 }}>
                  {[12, 18, 28, 14, 32, 22, 10, 24, 30, 16, 26, 12, 20, 28, 14, 22, 18].map((h, idx) => (
                    <div key={idx} style={{ flex: 1, height: isPlaying ? h : 10, background: "var(--teal-primary)", borderRadius: 99, transition: "height 0.2s" }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Transcript Timeline */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Call Transcript</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 260, overflowY: "auto" }}>
                {selectedCall.transcript.map((t, idx) => (
                  <div key={idx} style={{ fontSize: 13, padding: 10, borderRadius: 8, background: t.role === "AI Agent" ? "var(--teal-light)" : "var(--surface-2)" }}>
                    <strong style={{ color: t.role === "AI Agent" ? "var(--teal-dark)" : "var(--text)" }}>{t.role}: </strong>
                    <span>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={async () => {
                alert(`📞 Re-calling ${selectedCall.leadName}...`);
                await fetch("/api/calls/start", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ leadId: selectedCall.id, engine: "bolna", phone: selectedCall.phone })
                });
              }}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              📞 Re-Call Lead
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
