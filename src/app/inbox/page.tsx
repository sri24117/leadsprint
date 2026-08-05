"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";

type InboxLead = {
  id: string;
  name: string;
  phone: string;
  score: number;
  budget: string;
  area: string;
  timeline: Array<{ time: string; title: string; desc: string; type: "call" | "bot" | "visit" | "wa" }>;
  aiNotes: {
    budget: string;
    family: string;
    needs: string;
    interestedArea: string;
  };
};

const mockInboxData: InboxLead[] = [
  {
    id: "inbox-1",
    name: "Vijay",
    phone: "+919381948625",
    score: 98,
    budget: "₹75L – ₹95L",
    area: "Kondapur",
    timeline: [
      { time: "09:30 AM", title: "Incoming Call", desc: "Lead called from Facebook Meta ad", type: "call" },
      { time: "09:32 AM", title: "Budget Collected", desc: "AI extracted ₹75L - ₹95L budget in Telugu", type: "bot" },
      { time: "09:34 AM", title: "Property Suggested", desc: "Suggested Kondapur 3BHK Gated Community", type: "bot" },
      { time: "09:36 AM", title: "Site Visit Booked", desc: "Booked for Saturday at 11:00 AM", type: "visit" },
      { time: "09:37 AM", title: "WhatsApp Brochure Sent", desc: "Floor plan & price sheet delivered to WhatsApp", type: "wa" }
    ],
    aiNotes: {
      budget: "₹75L - ₹95L",
      family: "Family of 4 (spouse + 2 kids)",
      needs: "Near metro station & international school",
      interestedArea: "Kondapur / Kokapet 3BHK"
    }
  },
  {
    id: "inbox-2",
    name: "Pradeep Sharma",
    phone: "+919876543210",
    score: 88,
    budget: "₹75L – ₹90L",
    area: "Kondapur",
    timeline: [
      { time: "05:05 PM", title: "AI Outbound Call", desc: "Call placed via Bolna voice engine", type: "call" },
      { time: "05:08 PM", title: "Qualification Completed", desc: "Verified 2-3 month possession timeline", type: "bot" },
      { time: "05:10 PM", title: "WhatsApp Summary Sent", desc: "Confirmation message sent to lead", type: "wa" }
    ],
    aiNotes: {
      budget: "₹75L - ₹90L",
      family: "Working professional",
      needs: "Gated community amenities",
      interestedArea: "Kondapur"
    }
  }
];

export default function AIInboxPage() {
  const [selectedLead, setSelectedLead] = useState<InboxLead>(mockInboxData[0]);
  const [activeTab, setActiveTab] = useState<"all" | "call" | "wa">("all");

  const handleAction = (actionName: string) => {
    alert(`⚡ Executed action: ${actionName} for ${selectedLead.name}`);
  };

  return (
    <AppLayout pageTitle="AI Inbox">
      <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0, 1fr) 300px", gap: 20, minHeight: "calc(100vh - 140px)" }}>
        
        {/* Left Panel: Inbox Conversations List */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Conversations</h2>
            <div style={{ display: "flex", gap: 4 }}>
              {(["all", "call", "wa"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    border: 0,
                    borderRadius: 6,
                    padding: "3px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    background: activeTab === tab ? "var(--teal-primary)" : "var(--surface-2)",
                    color: activeTab === tab ? "white" : "var(--muted)"
                  }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mockInboxData.map((lead) => {
              const isSelected = selectedLead.id === lead.id;
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: isSelected ? "var(--teal-light)" : "var(--surface-2)",
                    border: isSelected ? "1px solid var(--teal-primary)" : "1px solid transparent",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: 14, color: "var(--text)" }}>{lead.name}</strong>
                    <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 800 }}>★ {lead.score}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    {lead.phone} • {lead.area}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(20,184,166,0.15)", color: "var(--teal-dark)" }}>☎ Call</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(22,163,74,0.15)", color: "var(--green-success)" }}>💬 WhatsApp</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Panel: Omnichannel Lead Timeline */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: "1px solid var(--line)", marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{selectedLead.name}</h2>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{selectedLead.phone} • {selectedLead.budget}</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleAction("Call")} className="btn-primary" style={{ height: 36, fontSize: 13 }}>
                ☎ Call Lead
              </button>
              <button onClick={() => handleAction("WhatsApp")} className="btn-secondary" style={{ height: 36, fontSize: 13 }}>
                💬 WhatsApp
              </button>
            </div>
          </div>

          {/* Timeline Cards */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>Activity Timeline</h3>
            {selectedLead.timeline.map((evt, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr",
                  gap: 14,
                  alignItems: "flex-start",
                  padding: 12,
                  borderRadius: 10,
                  background: "var(--surface-2)",
                  borderLeft: "3px solid var(--teal-primary)"
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--teal-primary)" }}>{evt.time}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{evt.title}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{evt.desc}</div>
                </div>
              </div>
            ))}

            {/* AI Extracted Notes */}
            <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: "var(--teal-light)", border: "1px solid rgba(20,184,166,0.3)" }}>
              <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: "var(--teal-dark)" }}>🧠 AI Extracted Intelligence Notes</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                <div><strong>Budget:</strong> {selectedLead.aiNotes.budget}</div>
                <div><strong>Family:</strong> {selectedLead.aiNotes.family}</div>
                <div><strong>Preferences:</strong> {selectedLead.aiNotes.needs}</div>
                <div><strong>Target Project:</strong> {selectedLead.aiNotes.interestedArea}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Human Takeover Action Menu */}
        <div className="glass-card">
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>⚡ Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "📞 Call Lead Now", action: "Call Lead" },
              { label: "💬 Send WhatsApp Brochure", action: "Send Brochure" },
              { label: "📅 Book Site Visit", action: "Book Visit" },
              { label: "📄 Generate Price Proposal", action: "Generate Proposal" },
              { label: "👤 Assign to Sales Executive", action: "Assign Executive" },
              { label: "✓ Close / Mark Qualified", action: "Close Lead" },
            ].map((act, idx) => (
              <button
                key={idx}
                onClick={() => handleAction(act.action)}
                className="btn-secondary"
                style={{ width: "100%", justifyContent: "flex-start", height: 42, fontSize: 13, fontWeight: 700 }}
              >
                {act.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
