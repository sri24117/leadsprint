"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"ai" | "voice" | "webhooks">("ai");

  const [bolnaApiKey, setBolnaApiKey] = useState("");
  const [bolnaAgentId, setBolnaAgentId] = useState("8942cb44-7a83-4fc5-a8a2-78ccc0321189");

  const [teluguPrompt, setTeluguPrompt] = useState(
    "Namaste sir! Nenu Hyderabad Prime Realty nundi AI assistant ni. Ee madhya mana new gated community project gurinchi enquiry chesaaru kada? Oka 2 minutes maatladacha?"
  );

  const handleSave = () => {
    alert("✅ Settings saved successfully!");
  };

  return (
    <AppLayout pageTitle="AI Agent Settings & API Keys">
      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[
          { id: "ai", label: "🤖 AI Prompt (Telugu/Hindi/English)" },
          { id: "voice", label: "🔑 Voice Engine Keys (Bolna & Vapi)" },
          { id: "webhooks", label: "🌐 Webhooks & Integration" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={activeTab === t.id ? "btn-primary" : "btn-secondary"}
            style={{ height: 38, fontSize: 13 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: AI Prompt Editor */}
      {activeTab === "ai" && (
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Telugu / Telish Conversational Prompt</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            This prompt is sent to your live Bolna agent (`8942cb44-7a83-4fc5-a8a2-78ccc0321189`) for Telugu real estate calls.
          </p>

          <div>
            <label style={{ fontSize: 12, fontWeight: 800, display: "block", marginBottom: 6 }}>Welcome Message (Telugu)</label>
            <textarea value={teluguPrompt} onChange={(e) => setTeluguPrompt(e.target.value)} rows={3} />
          </div>

          <button onClick={handleSave} className="btn-primary" style={{ width: 140 }}>
            Save Prompt
          </button>
        </div>
      )}

      {/* Tab 2: Voice Credentials */}
      {activeTab === "voice" && (
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Bolna Cloud Credentials</h2>

          <div>
            <label style={{ fontSize: 12, fontWeight: 800, display: "block", marginBottom: 6 }}>Bolna API Key</label>
            <input type="text" value={bolnaApiKey} onChange={(e) => setBolnaApiKey(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 800, display: "block", marginBottom: 6 }}>Bolna Outbound Agent ID</label>
            <input type="text" value={bolnaAgentId} onChange={(e) => setBolnaAgentId(e.target.value)} />
          </div>

          <button onClick={handleSave} className="btn-primary" style={{ width: 160 }}>
            Update API Keys
          </button>
        </div>
      )}

      {/* Tab 3: Webhooks */}
      {activeTab === "webhooks" && (
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Public Webhook URLs</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            Set these URLs in Bolna or Twilio dashboard to send transcripts back to LeadSprint.
          </p>

          <div style={{ padding: 12, borderRadius: 8, background: "var(--surface-2)", fontSize: 13 }}>
            <strong>Bolna Analytics Webhook:</strong> <code>http://localhost:3000/api/webhooks/bolna</code>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
