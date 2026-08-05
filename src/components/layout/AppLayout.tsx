"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import FloatingCopilot from "../copilot/FloatingCopilot";

export default function AppLayout({
  children,
  pageTitle = "Dashboard"
}: {
  children: React.ReactNode;
  pageTitle?: string;
}) {
  return (
    <div className="app-container">
      <Sidebar />
      <main style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Header pageTitle={pageTitle} />
        <div style={{ padding: "28px", flex: 1, minWidth: 0 }}>
          {children}
        </div>
      </main>
      <FloatingCopilot />
    </div>
  );
}
