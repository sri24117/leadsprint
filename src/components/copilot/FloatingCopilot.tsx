"use client";

import { useState } from "react";

export default function FloatingCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Namaste! I am your AI Sales Copilot. Ask me anything about today's calls, hot leads in Kondapur, or site visits."
    }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setQuery("");

    setTimeout(() => {
      let reply = "Here is what I found for you: 2 hot leads in Kondapur (Vijay & Pradeep) are ready for site visits this weekend.";
      if (userText.toLowerCase().includes("call") || userText.toLowerCase().includes("summarize")) {
        reply = "Today's AI calls: 86 calls placed, 93% success rate. 8 buyers booked site visits and 26 received WhatsApp brochures.";
      } else if (userText.toLowerCase().includes("drop") || userText.toLowerCase().includes("lost")) {
        reply = "2 leads dropped due to budget constraints (> 1.2 Crore). AI automatically scheduled a follow-up for 2BHK alternatives.";
      }
      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 600);
  };

  return (
    <div className="copilot-widget">
      {isOpen && (
        <div className="copilot-drawer">
          <div className="copilot-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>✨</span>
              <strong style={{ fontSize: 15 }}>LeadSprint Copilot</strong>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "transparent", border: 0, color: "white", fontSize: 16 }}
            >
              ✕
            </button>
          </div>

          <div className="copilot-body">
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  background: m.sender === "user" ? "var(--teal-primary)" : "var(--surface-2)",
                  color: m.sender === "user" ? "white" : "var(--text)",
                  padding: "10px 14px",
                  borderRadius: 12,
                  maxWidth: "85%",
                  fontSize: 13,
                  lineHeight: 1.4
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div style={{ padding: "8px 12px", background: "var(--surface-2)", display: "flex", gap: 6, overflowX: "auto" }}>
            {["Show hot leads", "Summarize calls", "Why did leads drop?"].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 99,
                  background: "var(--surface)",
                  padding: "3px 10px",
                  fontSize: 11,
                  whiteSpace: "nowrap"
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} className="copilot-input">
            <input
              type="text"
              placeholder="Ask AI Copilot..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" style={{ padding: "0 14px", height: 40 }}>
              Send
            </button>
          </form>
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className="copilot-trigger" title="Ask AI Copilot">
        <span style={{ fontSize: 22 }}>✨</span>
      </button>
    </div>
  );
}
