"use client";

import AppLayout from "@/components/layout/AppLayout";

export default function BillingPage() {
  return (
    <AppLayout pageTitle="Subscription & Call Minute Usage">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="glass-card">
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Current Active Plan</h2>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--teal-primary)" }}>Pilot Plan - ₹25,000 / mo</div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 16px" }}>Includes 500 AI qualification minutes & unlimited WhatsApp follow-ups.</p>
          <div style={{ padding: 14, borderRadius: 10, background: "var(--surface-2)", fontSize: 13 }}>
            <strong>Minutes Used:</strong> 218 / 500 Minutes (43% consumed)
          </div>
        </div>

        <div className="glass-card">
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Upgrade or Add Minutes</h2>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Add overage packs or upgrade to Enterprise for unlimited calling & custom voice profiles.</p>
          <button onClick={() => alert("Stripe Checkout Initiated!")} className="btn-primary" style={{ marginTop: 16 }}>
            💳 Upgrade Plan via Stripe
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
