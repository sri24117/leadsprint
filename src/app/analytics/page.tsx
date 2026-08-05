"use client";

import AppLayout from "@/components/layout/AppLayout";

export default function AnalyticsPage() {
  return (
    <AppLayout pageTitle="Sales Funnel & Conversion Analytics">
      {/* Funnel Pipeline Visualizer */}
      <div className="glass-card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Lead Qualification Funnel</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, textTransform: "uppercase" }}>
          {[
            { stage: "New Leads", count: "142", pct: "100%", color: "var(--teal-primary)" },
            { stage: "Qualified", count: "86", pct: "60.5%", color: "var(--teal-accent)" },
            { stage: "Site Visit", count: "28", pct: "32.5%", color: "var(--teal-dark)" },
            { stage: "Negotiation", count: "12", pct: "13.9%", color: "var(--amber-warning)" },
            { stage: "Closed Deals", count: "5", pct: "5.8%", color: "var(--green-success)" },
          ].map((item, idx) => (
            <div key={idx} style={{ padding: 16, borderRadius: 10, background: "var(--surface-2)", textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", marginBottom: 4 }}>{item.stage}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: item.color }}>{item.count}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginTop: 4 }}>Conversion: {item.pct}</div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
