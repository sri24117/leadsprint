"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";

type ActivityItem = {
  id: string;
  type: "qualified" | "faq" | "human_alert" | "whatsapp";
  title: string;
  badge: string;
  details: Record<string, string>;
  timeAgo: string;
};

const initialActivities: ActivityItem[] = [
  {
    id: "act-1",
    type: "qualified",
    title: "🤖 AI just qualified Vijay",
    badge: "✓ Site Visit Booked",
    details: {
      "Budget": "₹75L – ₹95L",
      "Area": "Kondapur",
      "Intent": "Ready to buy in 30 days",
      "Language": "Telugu / Telish"
    },
    timeAgo: "2 min ago"
  },
  {
    id: "act-2",
    type: "faq",
    title: "🤖 AI answered FAQ",
    badge: "97% Confidence",
    details: {
      "Question": '"Is covered parking & club membership included?"',
      "Answer": '"Yes, 1 covered parking slot is included in the base price."',
      "Lead": "Neha Verma"
    },
    timeAgo: "5 min ago"
  },
  {
    id: "act-3",
    type: "human_alert",
    title: "⚠️ AI needs human takeover",
    badge: "Action Required",
    details: {
      "Reason": "Customer asking about legal clearance & RERA approval details",
      "Lead": "Arjun Reddy (+91 91234 56789)",
      "Suggested Executive": "Assign to Ravi (Senior Sales Manager)"
    },
    timeAgo: "12 min ago"
  },
  {
    id: "act-4",
    type: "whatsapp",
    title: "💬 AI dispatched WhatsApp brochure",
    badge: "Delivered",
    details: {
      "Recipient": "Pradeep Sharma",
      "Document": "Kokapet 3BHK Floor Plan & Payment Schedule.pdf",
      "Status": "Opened by buyer"
    },
    timeAgo: "18 min ago"
  }
];

export default function DashboardPage() {
  const [activities] = useState<ActivityItem[]>(initialActivities);
  const [callingLead, setCallingLead] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleCall = async (phone: string, leadName: string) => {
    setCallingLead(leadName);
    try {
      await fetch("/api/calls/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: "21111111-1111-4111-8111-111111111111",
          engine: "bolna",
          phone: phone
        })
      });
      triggerToast(`📞 Live AI Lead Call Queued to ${leadName} (${phone})!`);
    } catch {
      triggerToast("❌ Failed to initiate call");
    } finally {
      setCallingLead(null);
    }
  };

  return (
    <AppLayout pageTitle="Executive Dashboard">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            marginBottom: 20,
            padding: "14px 20px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
            color: "white",
            fontWeight: 700,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 10px 25px rgba(20,184,166,0.35)"
          }}
        >
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} style={{ background: "transparent", border: 0, color: "white", fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Welcome Banner */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.5px" }}>
          Good Morning, Hyderabad Prime Realty 👋
        </div>
        <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
          Here is what your AI Agent accomplished today and where human support is needed.
        </div>
      </div>

      {/* KPI Performance Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 28
        }}
      >
        {[
          { label: "Calls Answered", value: "86", sub: "+74% contacted", color: "var(--teal-primary)" },
          { label: "WhatsApp Replies", value: "142", sub: "Auto-replied", color: "var(--teal-accent)" },
          { label: "Qualified Leads", value: "28", sub: "31% rate", color: "var(--green-success)" },
          { label: "Site Visits Booked", value: "11", sub: "+33% this week", color: "var(--teal-dark)" },
          { label: "Revenue Pipeline", value: "₹8.4 Cr", sub: "Hot buyers", color: "var(--amber-warning)" },
          { label: "AI Success Rate", value: "93%", sub: "High confidence", color: "var(--green-success)" },
        ].map((kpi, idx) => (
          <div key={idx} className="glass-card" style={{ padding: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {kpi.label}
            </span>
            <div style={{ fontSize: 34, fontWeight: 900, color: kpi.color, margin: "8px 0 2px" }}>
              {kpi.value}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* Main Grid: AI Live Activity Stream & Right Action Drawer */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(320px, 1fr)", gap: 24 }}>
        {/* AI Live Activity Feed */}
        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>⚡</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>AI Live Activity Feed</h2>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--teal-accent)", display: "flex", alignItems: "center", gap: 6 }}>
              <span className="pulse-dot" /> Live Stream
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {activities.map((act) => (
              <div
                key={act.id}
                className={`activity-card ${act.type === "human_alert" ? "human-alert" : act.type === "qualified" ? "qualified" : ""}`}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <strong style={{ fontSize: 15, color: "var(--text)" }}>{act.title}</strong>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: 99,
                        background: act.type === "human_alert" ? "var(--amber-warning)" : "var(--teal-primary)",
                        color: "white"
                      }}
                    >
                      {act.badge}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                      gap: 10,
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 10,
                      background: "var(--surface)"
                    }}
                  >
                    {Object.entries(act.details).map(([key, val]) => (
                      <div key={key}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>{key}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginTop: 2 }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{act.timeAgo}</span>
                    {act.type === "human_alert" && (
                      <button
                        onClick={() => triggerToast("⚡ Assigned to Ravi (Senior Manager) for Human Takeover")}
                        className="btn-primary"
                        style={{ height: 32, fontSize: 12, padding: "0 14px" }}
                      >
                        ⚡ Human Takeover Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Drawer: Quick Lead Call Trigger & Hot Action List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="glass-card">
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>🔥 Hot Leads Ready for Call</h2>
            {[
              { name: "Vijay", phone: "+919381948625", budget: "₹75L-95L", area: "Kondapur", score: 98 },
              { name: "Pradeep Sharma", phone: "+919876543210", budget: "₹75L-90L", area: "Kondapur", score: 88 },
              { name: "Arjun Reddy", phone: "+919123456789", budget: "₹1 Cr+", area: "Gachibowli", score: 81 },
            ].map((lead, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 0",
                  borderBottom: idx < 2 ? "1px solid var(--line)" : "none"
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{lead.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {lead.budget} • {lead.area}
                  </div>
                </div>
                <button
                  onClick={() => handleCall(lead.phone, lead.name)}
                  disabled={callingLead === lead.name}
                  className="btn-primary"
                  style={{ height: 36, padding: "0 14px", fontSize: 12 }}
                >
                  {callingLead === lead.name ? "Dialing..." : "📞 Call Now"}
                </button>
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)", color: "white" }}>
            <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.9, textTransform: "uppercase", letterSpacing: 0.5 }}>AI Agent Speed Guarantee</div>
            <div style={{ fontSize: 22, fontWeight: 900, margin: "8px 0" }}>⚡ {"< 10 Second Response Time"}</div>
            <p style={{ fontSize: 13, opacity: 0.85, margin: 0, lineHeight: 1.45 }}>
              LeadSprint automatically calls every new Meta/Google lead within 10 seconds in Telugu, Hindi, or English.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
