"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";

export default function CalendarPage() {
  const [selectedDay] = useState("Saturday, July 29");

  const timeSlots = [
    { time: "09:00 AM", lead: "Available Slot", status: "free" },
    { time: "11:00 AM", lead: "Vijay (Kondapur 3BHK Visit)", status: "booked" },
    { time: "02:00 PM", lead: "Neha Verma (Miyapur Tour)", status: "booked" },
    { time: "04:00 PM", lead: "Available Slot", status: "free" },
  ];

  return (
    <AppLayout pageTitle="AI Calendar & Slot Allocator">
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>📅 Schedule for {selectedDay}</h2>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99, background: "var(--teal-light)", color: "var(--teal-dark)" }}>
            Google Calendar Synced
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {timeSlots.map((slot, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr auto",
                gap: 16,
                alignItems: "center",
                padding: 14,
                borderRadius: 10,
                background: slot.status === "booked" ? "var(--teal-light)" : "var(--surface-2)",
                borderLeft: `4px solid ${slot.status === "booked" ? "var(--teal-primary)" : "var(--line)"}`
              }}
            >
              <strong style={{ fontSize: 14, color: "var(--teal-dark)" }}>{slot.time}</strong>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{slot.lead}</div>
              <button
                onClick={() => alert(`Slot ${slot.time} clicked`)}
                className={slot.status === "booked" ? "btn-primary" : "btn-secondary"}
                style={{ height: 32, fontSize: 12 }}
              >
                {slot.status === "booked" ? "View Details" : "+ Book Slot"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
