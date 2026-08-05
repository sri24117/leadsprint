"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";

type TeamMember = {
  name: string;
  role: string;
  email: string;
  assignedLeads: number;
  status: "active" | "offline";
};

const mockTeam: TeamMember[] = [
  { name: "Ravi Teja", role: "Senior Sales Manager", email: "ravi@leadsprint.local", assignedLeads: 14, status: "active" },
  { name: "Srikanth Pendem", role: "Workspace Admin", email: "srikanth@leadsprint.local", assignedLeads: 8, status: "active" },
  { name: "Ananya Sharma", role: "Sales Executive (Hindi Focus)", email: "ananya@leadsprint.local", assignedLeads: 11, status: "active" }
];

export default function TeamPage() {
  const [team] = useState<TeamMember[]>(mockTeam);

  return (
    <AppLayout pageTitle="Team Management & Roles">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Sales Executives & Managers</h2>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Manage human takeover routing & lead assignments</span>
        </div>
        <button onClick={() => alert("Invite Member Modal")} className="btn-primary">
          + Invite Team Member
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {team.map((member, idx) => (
          <div key={idx} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{member.name}</h3>
              <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: "var(--teal-light)", color: "var(--teal-dark)" }}>
                🟢 {member.status.toUpperCase()}
              </span>
            </div>

            <div style={{ fontSize: 13, color: "var(--muted)" }}>{member.role}</div>
            <div style={{ fontSize: 12, color: "var(--text)" }}>{member.email}</div>

            <div style={{ padding: 10, borderRadius: 8, background: "var(--surface-2)", fontSize: 12, fontWeight: 700 }}>
              Active Lead Queue: {member.assignedLeads} Buyers Assigned
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
