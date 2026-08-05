"use client";

import { useState } from "react";

export default function Header({ pageTitle }: { pageTitle: string }) {
  const [selectedLang, setSelectedLang] = useState<"te" | "en" | "hi">("te");
  const [callingState, setCallingState] = useState(false);

  const handleTestCall = async () => {
    setCallingState(true);
    try {
      await fetch("/api/calls/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: "21111111-1111-4111-8111-111111111111",
          engine: "bolna",
          phone: "+919381948625"
        })
      });
      alert("📞 Live AI Lead Call Queued to +919381948625!");
    } catch {
      alert("Call failed to initiate");
    } finally {
      setCallingState(false);
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="page-title">{pageTitle}</h1>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "99px",
            background: "var(--teal-light)",
            color: "var(--teal-dark)",
            fontSize: "12px",
            fontWeight: 700
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
          🟢 AI Teammate Online
        </div>
      </div>

      <div className="header-right">
        {/* Language selector */}
        <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", padding: 3, borderRadius: 8 }}>
          {(["te", "en", "hi"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              style={{
                border: 0,
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 700,
                background: selectedLang === lang ? "var(--teal-primary)" : "transparent",
                color: selectedLang === lang ? "white" : "var(--muted)"
              }}
            >
              {lang === "te" ? "Telugu" : lang === "hi" ? "Hindi" : "English"}
            </button>
          ))}
        </div>

        <button onClick={handleTestCall} disabled={callingState} className="btn-primary">
          <span>📞</span>
          {callingState ? "Dialing..." : "Test AI Call"}
        </button>
      </div>
    </header>
  );
}
