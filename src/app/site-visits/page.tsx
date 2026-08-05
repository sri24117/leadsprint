"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";

type VisitItem = {
  id: string;
  leadName: string;
  phone: string;
  project: string;
  timeSlot: string;
  status: "booked" | "completed" | "cancelled" | "no_show";
  notes: string;
};

const mockVisits: VisitItem[] = [
  {
    id: "v-1",
    leadName: "Vijay",
    phone: "+919381948625",
    project: "Hyderabad Prime Heights (Kondapur)",
    timeSlot: "Saturday, 11:00 AM",
    status: "booked",
    notes: "AI confirmed slot; sent Google Maps location via WhatsApp."
  },
  {
    id: "v-2",
    leadName: "Neha Verma",
    phone: "+919988766554",
    project: "Miyapur Model Flat",
    timeSlot: "Tomorrow, 02:30 PM",
    status: "booked",
    notes: "Prefers Hindi speaking sales representative."
  }
];

export default function SiteVisitsPage() {
  const [visits, setVisits] = useState<VisitItem[]>(mockVisits);

  const toggleStatus = (id: string, newStatus: VisitItem["status"]) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
    );
  };

  return (
    <AppLayout pageTitle="Site Visit Planner">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Booked Site Visits</h2>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>AI automatically schedules site visit appointments with qualified buyers</span>
        </div>
        <button onClick={() => alert("Schedule Visit Modal")} className="btn-primary">
          + Book Site Visit
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
        {visits.map((visit) => (
          <div key={visit.id} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{visit.leadName}</h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: 99,
                  background: visit.status === "completed" ? "var(--teal-light)" : "rgba(245,158,11,0.15)",
                  color: visit.status === "completed" ? "var(--teal-dark)" : "var(--amber-warning)"
                }}
              >
                {visit.status.toUpperCase()}
              </span>
            </div>

            <div style={{ fontSize: 13, color: "var(--muted)" }}>{visit.phone}</div>

            <div style={{ padding: 12, borderRadius: 8, background: "var(--surface-2)", fontSize: 13 }}>
              <div><strong>Project:</strong> {visit.project}</div>
              <div style={{ marginTop: 4 }}><strong>Scheduled Time:</strong> 🕒 {visit.timeSlot}</div>
            </div>

            <p style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>
              <strong>AI Notes:</strong> {visit.notes}
            </p>

            <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--line)" }}>
              <button onClick={() => toggleStatus(visit.id, "completed")} className="btn-secondary" style={{ flex: 1, fontSize: 12 }}>
                ✓ Mark Completed
              </button>
              <button onClick={() => toggleStatus(visit.id, "no_show")} className="btn-secondary" style={{ flex: 1, fontSize: 12, color: "var(--red-danger)" }}>
                ✕ No Show
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
