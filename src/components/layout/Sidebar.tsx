"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "AI Inbox", href: "/inbox", icon: "📥", badge: "3 Hot" },
  { label: "Leads", href: "/leads", icon: "👥" },
  { label: "Calls", href: "/calls", icon: "📞", badge: "Live" },
  { label: "WhatsApp", href: "/whatsapp", icon: "💬" },
  { label: "Properties", href: "/properties", icon: "🏢" },
  { label: "Site Visits", href: "/site-visits", icon: "📅", badge: "8" },
  { label: "Calendar", href: "/calendar", icon: "🗓️" },
  { label: "AI Knowledge", href: "/knowledge", icon: "🧠" },
  { label: "Team", href: "/team", icon: "👔" },
  { label: "Analytics", href: "/analytics", icon: "📈" },
  { label: "Billing", href: "/billing", icon: "💳" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
  };

  return (
    <aside className="app-sidebar">
      <div>
        <div className="brand-header">
          <div className="brand-icon">LS</div>
          <div className="brand-title">
            <h2>LeadSprint</h2>
            <span>AI Real Estate Qualifier</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                <div className="nav-link-content">
                  <span>{item.icon}</span>
                  <span className="nav-link-text">{item.label}</span>
                </div>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        <div className="sidebar-ai-widget">
          <div className="ai-status-indicator">
            <div className="pulse-dot" />
            <span>AI Agent Active</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>
            218 / 500 Calls Used Today
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="btn-secondary"
          style={{ width: "100%", marginTop: "12px", justifyContent: "center", height: "36px", fontSize: "12px" }}
        >
          {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
    </aside>
  );
}
