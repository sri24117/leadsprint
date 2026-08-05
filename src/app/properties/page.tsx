"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";

type PropertyProject = {
  id: string;
  name: string;
  builder: string;
  location: string;
  startingPrice: string;
  availability: string;
  types: string[];
  amenities: string[];
  nearby: string[];
  description: string;
};

const mockProjects: PropertyProject[] = [
  {
    id: "proj-1",
    name: "Hyderabad Prime Heights",
    builder: "Prime Realty Infrastructure",
    location: "Kondapur, Hyderabad",
    startingPrice: "₹75 Lakhs",
    availability: "14 Flats Available",
    types: ["2BHK (1250 sqft)", "3BHK (1850 sqft)"],
    amenities: ["Clubhouse 15k sqft", "Infinity Swimming Pool", "Covered Parking", "24/7 Security"],
    nearby: ["1.2 km from Kondapur Metro", "800m from Botanical Garden"],
    description: "Premium luxury gated community apartments with world-class amenities near IT Hub."
  },
  {
    id: "proj-2",
    name: "Kokapet Grand Residency",
    builder: "Grand Builders & Developers",
    location: "Kokapet, Hyderabad",
    startingPrice: "₹1.10 Crore",
    availability: "8 Flats Available",
    types: ["3BHK (2100 sqft)", "4BHK Duplex (3200 sqft)"],
    amenities: ["Rooftop Tennis Court", "EV Charging Stations", "Concierge Service"],
    nearby: ["Direct ORR Access", "Near Financial District"],
    description: "Ultra-luxury high-rise residences with panoramic lake views and smart home automation."
  }
];

export default function PropertiesPage() {
  const [projects] = useState<PropertyProject[]>(mockProjects);

  return (
    <AppLayout pageTitle="Real Estate Property Portfolio">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Active Projects & Inventory</h2>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>AI Caller automatically uses these property details to qualify buyers</span>
        </div>
        <button onClick={() => alert("Add Project Modal")} className="btn-primary">
          + Add New Project
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 20 }}>
        {projects.map((proj) => (
          <div key={proj.id} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{proj.name}</h3>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{proj.builder} • {proj.location}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 99, background: "var(--teal-light)", color: "var(--teal-dark)" }}>
                {proj.availability}
              </span>
            </div>

            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--teal-primary)" }}>
              Starting from {proj.startingPrice}
            </div>

            <p style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>{proj.description}</p>

            <div style={{ padding: 12, borderRadius: 8, background: "var(--surface-2)", fontSize: 13 }}>
              <strong>Available Configurations:</strong>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                {proj.types.map((t, idx) => (
                  <span key={idx} style={{ padding: "3px 8px", borderRadius: 6, background: "var(--surface)", fontSize: 12, fontWeight: 700 }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 13 }}>
              <strong>Key Amenities:</strong>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {proj.amenities.map((a, idx) => (
                  <span key={idx} style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "rgba(20,184,166,0.12)", color: "var(--teal-dark)" }}>
                    ✓ {a}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--line)" }}>
              <button onClick={() => alert("Brochure Downloaded!")} className="btn-secondary" style={{ flex: 1, fontSize: 12 }}>
                📄 Download Brochure
              </button>
              <button onClick={() => alert("Inventory Sheet Opened!")} className="btn-primary" style={{ flex: 1, fontSize: 12 }}>
                🏢 View Inventory
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
