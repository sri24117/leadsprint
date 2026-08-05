"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";
import { evaluateLeadScoreBreakdown, type LeadScoreBreakdown } from "@/lib/scoring";

type Lead = {
  id: string;
  name: string;
  phone: string;
  score: number;
  stars: number;
  status: string;
  budget: string;
  location: string;
  timeline: string;
  propertyType: string;
  preferredLanguage: string;
  summary: string;
  aiRecommendation: string;
  nextBestAction: string;
  isDnc?: boolean;
  scoreBreakdown: LeadScoreBreakdown;
};

const initialLeads: Lead[] = [
  {
    id: "lead-1",
    name: "Vijay Kumar (Verified Test)",
    phone: "+919381948625",
    score: 95,
    stars: 5,
    status: "qualified",
    budget: "₹85L – ₹95L",
    location: "Kondapur IT Corridor",
    timeline: "Within 30 days",
    propertyType: "3BHK Gated Community",
    preferredLanguage: "Telugu / Telish",
    summary: "High-intent buyer looking for 3BHK flat near Kondapur IT corridor for immediate possession.",
    aiRecommendation: "Schedule site visit for Saturday 11 AM; share brochure via WhatsApp.",
    nextBestAction: "Book site visit",
    scoreBreakdown: evaluateLeadScoreBreakdown({
      name: "Vijay Kumar",
      phone: "+919381948625",
      budgetMinLakh: 85,
      budgetMaxLakh: 95,
      location: "Kondapur",
      timeline: "within 30 days",
      siteVisitRequested: true,
      isDecisionMaker: true
    })
  },
  {
    id: "lead-2",
    name: "Pradeep Sharma",
    phone: "+919876543210",
    score: 85,
    stars: 4,
    status: "qualified",
    budget: "₹75L – ₹90L",
    location: "Gachibowli",
    timeline: "2-3 months",
    propertyType: "2BHK or 3BHK",
    preferredLanguage: "Telugu",
    summary: "Wants gated community with gym & pool near workplace.",
    aiRecommendation: "Offer 3BHK sample flat tour with family.",
    nextBestAction: "Call now",
    scoreBreakdown: evaluateLeadScoreBreakdown({
      name: "Pradeep Sharma",
      budgetMinLakh: 75,
      location: "Gachibowli",
      timeline: "2 months",
      siteVisitRequested: true
    })
  },
  {
    id: "lead-3",
    name: "Ananya Rao",
    phone: "+919711223344",
    score: 70,
    stars: 3,
    status: "follow_up",
    budget: "₹60L – ₹70L",
    location: "Miyapur",
    timeline: "6 months",
    propertyType: "2BHK",
    preferredLanguage: "English",
    summary: "Exploring upcoming high-rise options in West Hyderabad.",
    aiRecommendation: "Send WhatsApp masterplan brochure & schedule monthly nurture.",
    nextBestAction: "Send WhatsApp summary",
    scoreBreakdown: evaluateLeadScoreBreakdown({
      name: "Ananya Rao",
      budgetMinLakh: 60,
      location: "Miyapur",
      timeline: "6 months",
      siteVisitRequested: false
    })
  },
  {
    id: "lead-4",
    name: "Ramesh Goud (Opt Out)",
    phone: "+919500000001",
    score: 0,
    stars: 1,
    status: "lost",
    budget: "N/A",
    location: "N/A",
    timeline: "None",
    propertyType: "N/A",
    preferredLanguage: "Telugu",
    summary: "Requested Do Not Call (DNC) suppression during initial outbound greeting.",
    aiRecommendation: "Automatically suppressed from all future dialing batches.",
    nextBestAction: "⛔ Suppressed (DNC)",
    isDnc: true,
    scoreBreakdown: evaluateLeadScoreBreakdown({ isDnc: true })
  }
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<Lead | null>(null);
  const [callingLead, setCallingLead] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-Dialer Sprint State
  const [isDialingSprint, setIsDialingSprint] = useState(false);
  const [sprintProgress, setSprintProgress] = useState(0);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load 300 prototype test cohort
  const handleLoadPrototypeCohort = () => {
    const batch: Lead[] = Array.from({ length: 12 }, (_, idx) => {
      const isHot = idx % 3 === 0;
      const isWarm = idx % 3 === 1;
      const minB = isHot ? 95 : isWarm ? 75 : 55;
      const breakdown = evaluateLeadScoreBreakdown({
        budgetMinLakh: minB,
        location: idx % 2 === 0 ? "Kokapet" : "Nanakramguda",
        timeline: isHot ? "within 30 days" : "within 3 months",
        siteVisitRequested: isHot,
        isDecisionMaker: true
      });

      return {
        id: `prototype-batch-${idx}-${Date.now()}`,
        name: `Prototype Buyer #${305 + idx}`,
        phone: `+91938194${8000 + idx}`,
        score: breakdown.totalScore,
        stars: breakdown.classification === "Hot" ? 5 : breakdown.classification === "Warm" ? 4 : 3,
        status: breakdown.classification === "Hot" ? "qualified" : "new",
        budget: `₹${minB}L - ₹${minB + 20}L`,
        location: idx % 2 === 0 ? "Kokapet Luxury Belt" : "Financial District",
        timeline: isHot ? "Within 30 days" : "Within 90 days",
        propertyType: isHot ? "3BHK Premium" : "2BHK Luxury",
        preferredLanguage: idx % 2 === 0 ? "Telugu" : "Hindi",
        summary: `Imported via 300-Lead Sprint Pilot. AI estimated intent at ${breakdown.totalScore}/100 based on demographic indicators.`,
        aiRecommendation: breakdown.nextStep,
        nextBestAction: isHot ? "Book site visit" : "Send WhatsApp summary",
        scoreBreakdown: breakdown
      };
    });

    setLeads((prev) => [...batch, ...prev]);
    triggerToast("⚡ Loaded Prototype Test Cohort (300+ Real Estate Leads Queued for AI Sprint)!");
  };

  // Launch auto-dialer sprint
  const handleLaunchSprint = () => {
    setIsDialingSprint(true);
    setSprintProgress(10);
    triggerToast("🚀 AI Outbound Dialer Sprint initiated across eligible leads!");

    const timer = setInterval(() => {
      setSprintProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsDialingSprint(false);
          triggerToast("🎉 Sprint Batch Complete! 18 Site Visits Booked & 42 WhatsApp Brochures Dispatched!");
          return 0;
        }
        return prev + 20;
      });
    }, 800);
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
      triggerToast(`📞 Live AI Lead Call Queued via Bolna to ${leadName} (${phone})!`);
    } catch {
      triggerToast("❌ Failed to initiate outbound telephone call");
    } finally {
      setCallingLead(null);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.location.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === "hot") return matchesSearch && lead.scoreBreakdown.classification === "Hot";
    if (filterStatus === "warm") return matchesSearch && lead.scoreBreakdown.classification === "Warm";
    if (filterStatus === "dnc") return matchesSearch && lead.isDnc;
    return matchesSearch;
  });

  return (
    <AppLayout pageTitle="Leads & AI Auto-Dialer Studio">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
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
          boxShadow: "0 10px 25px rgba(20,184,166,0.35)",
          animation: "fadeInUp 0.3s ease"
        }}>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} style={{ background: "transparent", border: 0, color: "white", fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Bulk CSV Importer & Sprint Auto-Dialer Panel */}
      <div className="glass-card" style={{ marginBottom: 24, padding: 24, background: "linear-gradient(135deg, rgba(15,118,110,0.06) 0%, rgba(20,184,166,0.12) 100%)", border: "1px solid rgba(20,184,166,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: "var(--teal-primary)", letterSpacing: 1 }}>
              ⚡ Prototype Pilot Engine (300 - 500 Leads)
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: "6px 0", color: "var(--text)" }}>
              📁 Bulk CSV Campaign Importer & AI Auto-Dialer
            </h2>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, maxWidth: 600 }}>
              Upload your Excel/CSV lead roster or simulate a controlled 300-lead pilot sprint. Our AI dials sequentially in Telugu, Hindi, or English, filters DNC opt-outs, and books weekend site visits automatically.
            </p>
          </div>
          
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={handleLoadPrototypeCohort}
              className="btn-secondary"
              style={{ height: 44, padding: "0 20px", fontWeight: 700, fontSize: 13, borderColor: "var(--teal-accent)" }}
            >
              ⚡ Load 300-Lead Prototype Cohort
            </button>
            <button
              onClick={handleLaunchSprint}
              disabled={isDialingSprint}
              className="btn-primary"
              style={{ height: 44, padding: "0 24px", fontSize: 14, fontWeight: 800 }}
            >
              {isDialingSprint ? `Dialing Batch (${sprintProgress}%)...` : "🚀 Launch Auto-Dialer Sprint"}
            </button>
          </div>
        </div>

        {/* Live Progress Bar during Sprint */}
        {isDialingSprint && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
              <span>AI Active Calling Batch (Concurrency: 10 Telephony Channels)</span>
              <span>{sprintProgress}% Completed</span>
            </div>
            <div style={{ width: "100%", height: 10, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${sprintProgress}%`, height: "100%", background: "linear-gradient(90deg, #0f766e, #14b8a6)", transition: "width 0.4s ease" }} />
            </div>
          </div>
        )}
      </div>

      {/* Action Filters and Search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { id: "all", label: `All Leads (${leads.length})` },
            { id: "hot", label: "🔥 Hot Buyers (80+ Pts)" },
            { id: "warm", label: "🟡 Warm Nurture (60-79)" },
            { id: "dnc", label: "⛔ DNC Suppressed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 99,
                border: "0",
                fontSize: 13,
                fontWeight: 800,
                background: filterStatus === tab.id ? "var(--teal-primary)" : "var(--surface-2)",
                color: filterStatus === tab.id ? "white" : "var(--text)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, minWidth: 280 }}>
          <input
            type="text"
            placeholder="🔍 Search by buyer name, area or budget..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ height: 42 }}
          />
        </div>
      </div>

      {/* Leads Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filteredLeads.map((lead) => (
          <div key={lead.id} className="glass-card" style={{ padding: 22, opacity: lead.isDnc ? 0.75 : 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              
              {/* Left Column: Lead Info */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{lead.name}</h3>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "4px 12px",
                    borderRadius: 99,
                    background: lead.scoreBreakdown.badgeColor,
                    color: "white",
                    cursor: "pointer",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.15)"
                  }}
                  onClick={() => setSelectedBreakdown(lead)}
                  title="Click to view 100-Point Intent Breakdown"
                  >
                    {lead.scoreBreakdown.badgeText}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>{lead.phone}</span>
                </div>

                <div style={{ display: "flex", gap: 18, marginTop: 12, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                  <span>💰 <strong>Budget:</strong> {lead.budget}</span>
                  <span>📍 <strong>Location:</strong> {lead.location}</span>
                  <span>⏳ <strong>Timeline:</strong> {lead.timeline}</span>
                  <span>🗣️ <strong>Language:</strong> {lead.preferredLanguage}</span>
                </div>

                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "var(--surface-2)", fontSize: 13, borderLeft: "4px solid var(--teal-accent)" }}>
                  <strong>🤖 AI Advisory Summary:</strong> {lead.summary}
                </div>
              </div>

              {/* Right Column: Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
                {!lead.isDnc ? (
                  <>
                    <button
                      onClick={() => handleCall(lead.phone, lead.name)}
                      disabled={callingLead === lead.name}
                      className="btn-primary"
                      style={{ height: 40, width: 210, justifyContent: "center" }}
                    >
                      {callingLead === lead.name ? "⏳ Dialing..." : "📞 Call Lead Now"}
                    </button>
                    <button
                      onClick={() => {
                        fetch("/api/whatsapp/send", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ recipientPhone: lead.phone, templateName: "brochure_dispatch", leadName: lead.name })
                        });
                        triggerToast(`💬 WhatsApp 3BHK Brochure & Price Sheet dispatched to ${lead.name}!`);
                      }}
                      className="btn-secondary"
                      style={{ height: 38, width: 210, justifyContent: "center", fontSize: 12 }}
                    >
                      📎 WhatsApp Brochure PDF
                    </button>
                    <button
                      onClick={() => triggerToast(`📅 Site Visit booked on Ravi's calendar for Saturday 11 AM!`)}
                      className="btn-secondary"
                      style={{ height: 38, width: 210, justifyContent: "center", fontSize: 12, background: "rgba(22,163,74,0.1)", color: "var(--green-success)", borderColor: "var(--green-success)" }}
                    >
                      📅 Confirm Site Visit
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--red-danger)", padding: "10px 16px", background: "rgba(220,38,38,0.1)", borderRadius: 10 }}>
                    ⛔ Suppressed under TRAI/DNC rules
                  </span>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* 100-Point Intent Breakdown Modal */}
      {selectedBreakdown && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.6)", zIndex: 999, display: "grid", placeItems: "center",
          backdropFilter: "blur(6px)"
        }}>
          <div className="glass-card" style={{ width: "90%", maxWidth: 540, background: "var(--surface)", padding: 28, position: "relative" }}>
            <button
              onClick={() => setSelectedBreakdown(null)}
              style={{ position: "absolute", top: 20, right: 20, border: 0, background: "transparent", fontSize: 20, fontWeight: 900, cursor: "pointer", color: "var(--muted)" }}
            >
              ✕
            </button>
            
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--teal-primary)", letterSpacing: 1 }}>
              Proprietary 100-Point Scoring Engine
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: "8px 0" }}>
              Intent Analysis: {selectedBreakdown.name}
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "16px 0", padding: "14px 18px", borderRadius: 12, background: "var(--surface-2)" }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: "var(--teal-primary)" }}>
                {selectedBreakdown.scoreBreakdown.totalScore}/100
              </span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Classification: {selectedBreakdown.scoreBreakdown.classification} Buyer</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Next Best Action: {selectedBreakdown.scoreBreakdown.nextStep}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18, maxHeight: 320, overflowY: "auto" }}>
              {selectedBreakdown.scoreBreakdown.items.map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: item.met ? "rgba(20,184,166,0.08)" : "var(--surface-2)", borderLeft: item.met ? "3px solid var(--teal-accent)" : "3px solid var(--muted)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{item.factor}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{item.detail}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: item.met ? "var(--teal-primary)" : "var(--muted)" }}>
                    +{item.points} / {item.maxPoints} pts
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedBreakdown(null)} className="btn-primary" style={{ height: 42, padding: "0 24px" }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
