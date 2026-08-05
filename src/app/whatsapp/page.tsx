"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";

type ChatMessage = {
  sender: "lead" | "ai" | "human";
  text: string;
  time: string;
  attachment?: {
    fileName: string;
    url: string;
    status: string;
  };
};

type WhatsAppChat = {
  id: string;
  leadName: string;
  phone: string;
  messages: ChatMessage[];
  aiSuggestions: string[];
};

const mockChats: WhatsAppChat[] = [
  {
    id: "wa-1",
    leadName: "Vijay Kumar",
    phone: "+919381948625",
    messages: [
      { sender: "ai", text: "Namaste Vijay, thanks for speaking with Hyderabad Prime Realty! We noted your budget ₹85L-95L for Kondapur. Your site visit is booked for Saturday at 11 AM.", time: "09:37 AM" },
      { sender: "lead", text: "Thank you! Can you also send the Kokapet 3BHK brochure and site location on Google Maps?", time: "09:40 AM" }
    ],
    aiSuggestions: [
      "📄 Dispatch 3BHK Master Brochure & Price Sheet",
      "📍 Send Google Maps Site Navigation Link",
      "📅 Confirm Saturday 11 AM VIP Walkthrough"
    ]
  },
  {
    id: "wa-2",
    leadName: "Pradeep Sharma",
    phone: "+919876543210",
    messages: [
      { sender: "ai", text: "Hi Pradeep, here is the summary of our call regarding Kondapur 2BHK/3BHK flats.", time: "05:10 PM" },
      { sender: "lead", text: "What is the starting price for 2BHK?", time: "05:12 PM" }
    ],
    aiSuggestions: [
      "💰 Send Price Sheet for 2BHK (Starting ₹75L)",
      "📞 Schedule Callback with Senior Sales Manager Ravi"
    ]
  }
];

export default function WhatsAppPage() {
  const [chats, setChats] = useState<WhatsAppChat[]>(mockChats);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat>(mockChats[0]);
  const [replyText, setReplyText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSendMessage = async (customText?: string, templateName?: string) => {
    const textToSend = customText || replyText;
    if (!textToSend.trim() && !templateName) return;

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientPhone: selectedChat.phone,
          leadName: selectedChat.leadName,
          templateName: templateName || "custom",
          customMessage: textToSend
        })
      });

      const data = await res.json();
      if (data.status === "success") {
        const newMsg: ChatMessage = {
          sender: "human",
          text: data.content || textToSend,
          time: "Just now",
          attachment: data.attachment
        };

        const updatedMessages = [...selectedChat.messages, newMsg];
        const updatedChat = { ...selectedChat, messages: updatedMessages };

        setSelectedChat(updatedChat);
        setChats((prev) => prev.map((c) => c.id === selectedChat.id ? updatedChat : c));
        setReplyText("");
        triggerToast(`✅ WhatsApp message dispatched instantly to ${selectedChat.phone}!`);
      } else {
        triggerToast("❌ Failed to send WhatsApp message via provider");
      }
    } catch {
      triggerToast("❌ Network error connecting to WhatsApp dispatcher");
    }
  };

  return (
    <AppLayout pageTitle="Omnichannel WhatsApp Business Center">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          marginBottom: 18,
          padding: "12px 18px",
          borderRadius: 12,
          background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
          color: "white",
          fontWeight: 700,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 10px 25px rgba(20,184,166,0.35)",
          animation: "fadeInUp 0.3s ease"
        }}>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} style={{ background: "transparent", border: 0, color: "white", fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Top Provider Status Banner */}
      <div className="glass-card" style={{ padding: "14px 22px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(22, 163, 74, 0.08)", border: "1px solid rgba(22, 163, 74, 0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>🟢</span>
          <div>
            <span style={{ fontSize: 14, fontWeight: 900, color: "var(--text)" }}>WATI & Meta Cloud API Sync Active</span>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Automated speed-to-lead brochure attachment dispatcher ready for all qualified outbound callers.</div>
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--green-success)", padding: "4px 12px", borderRadius: 99, background: "rgba(22, 163, 74, 0.15)" }}>
          ✓✓ Webhooks Verified
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0, 1.4fr) 320px", gap: 20, minHeight: "calc(100vh - 220px)" }}>
        
        {/* Left: Chat Contacts List */}
        <div className="glass-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>💬 Active Lead Chats</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {chats.map((c) => {
              const isSelected = selectedChat.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedChat(c)}
                  style={{
                    padding: "14px 12px",
                    borderRadius: 12,
                    background: isSelected ? "linear-gradient(135deg, rgba(15,118,110,0.15), rgba(20,184,166,0.08))" : "var(--surface-2)",
                    border: isSelected ? "1px solid var(--teal-accent)" : "1px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 15, color: "var(--text)" }}>{c.leadName}</strong>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>10m</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal-primary)", marginTop: 2 }}>{c.phone}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.messages[c.messages.length - 1]?.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Chat Window */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "16px 20px", background: "var(--surface-2)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <strong style={{ fontSize: 17, color: "var(--text)" }}>{selectedChat.leadName}</strong>
              <div style={{ fontSize: 12, color: "var(--green-success)", fontWeight: 700, marginTop: 2 }}>
                🟢 Verified WhatsApp Number • {selectedChat.phone}
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, padding: "4px 10px", background: "var(--teal-primary)", color: "white", borderRadius: 99 }}>
              🤖 AI Automated Follow-up
            </span>
          </div>

          {/* Messages Feed */}
          <div style={{ flex: 1, padding: 22, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", background: "radial-gradient(circle at 50% 50%, rgba(20,184,166,0.02) 0%, transparent 100%)" }}>
            {selectedChat.messages.map((m, idx) => {
              const isLead = m.sender === "lead";
              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: isLead ? "flex-start" : "flex-end" }}>
                  <div style={{
                    maxWidth: "80%",
                    padding: "12px 16px",
                    borderRadius: isLead ? "14px 14px 14px 4px" : "14px 14px 4px 14px",
                    background: isLead ? "var(--surface-2)" : "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
                    color: isLead ? "var(--text)" : "white",
                    fontSize: 14,
                    lineHeight: 1.45,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    whiteSpace: "pre-wrap"
                  }}>
                    {m.text}

                    {/* PDF Attachment Badge */}
                    {m.attachment && (
                      <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>📄</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>{m.attachment.fileName}</div>
                          <div style={{ fontSize: 11, opacity: 0.85 }}>2.4 MB PDF • {m.attachment.status} ✓✓</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, padding: "0 4px" }}>
                    {m.sender === "ai" ? "🤖 AI Teammate • " : m.sender === "human" ? "👔 Sales Mgr • " : "👤 Buyer • "}
                    {m.time} {m.sender !== "lead" && "✓✓"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input Footer */}
          <div style={{ padding: 14, borderTop: "1px solid var(--line)", background: "var(--surface)", display: "flex", gap: 12 }}>
            <input
              type="text"
              placeholder="Write a reply or type custom message..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              style={{ flex: 1, height: 44, borderRadius: 99, padding: "0 20px" }}
            />
            <button
              onClick={() => handleSendMessage()}
              className="btn-primary"
              style={{ height: 44, padding: "0 26px", borderRadius: 99, fontWeight: 800 }}
            >
              Send 🚀
            </button>
          </div>
        </div>

        {/* Right: AI Smart Suggestions & 1-Click Brochure Dispatchers */}
        <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: "var(--teal-primary)", letterSpacing: 1 }}>
              ⚡ Speed-to-Lead Actions
            </span>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: "6px 0 4px" }}>1-Click Brochure Dispatch</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>
              Instantly fire off project documents and VIP calendar bookings without typing.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => handleSendMessage(undefined, "brochure_dispatch")}
              className="btn-primary"
              style={{ width: "100%", height: 46, justifyContent: "flex-start", padding: "0 16px", fontSize: 13, background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)" }}
            >
              📄 Send 3BHK Brochure & Price Sheet
            </button>
            <button
              onClick={() => handleSendMessage(undefined, "site_visit_confirm")}
              className="btn-secondary"
              style={{ width: "100%", height: 46, justifyContent: "flex-start", padding: "0 16px", fontSize: 13, borderColor: "var(--teal-primary)", color: "var(--teal-primary)", fontWeight: 800 }}
            >
              📍 Send GPS Site Navigation Link
            </button>
            <button
              onClick={() => handleSendMessage("Namaste! Following up on your 3BHK property query. Would you like our senior manager to share the spot-booking payment schedule over a quick 2-minute call?", "custom")}
              className="btn-secondary"
              style={{ width: "100%", height: 46, justifyContent: "flex-start", padding: "0 16px", fontSize: 13 }}
            >
              💬 Send Spot-Booking Payment Offer
            </button>
          </div>

          <hr style={{ border: "0", borderTop: "1px solid var(--line)", margin: "4px 0" }} />

          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 10px" }}>🤖 AI Conversational Suggestions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedChat.aiSuggestions.map((sug, idx) => (
                <div
                  key={idx}
                  onClick={() => setReplyText(sug.replace(/^[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u25A0-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim())}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "var(--surface-2)",
                    border: "1px dashed var(--muted)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    color: "var(--text)",
                    transition: "all 0.2s ease"
                  }}
                  title="Click to insert into reply box"
                >
                  ✨ {sug}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
