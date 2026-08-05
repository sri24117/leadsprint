"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";

type KnowledgeDoc = {
  id: string;
  filename: string;
  category: string;
  size: string;
  status: "indexed" | "processing";
  uploadedAt: string;
};

const mockDocs: KnowledgeDoc[] = [
  { id: "doc-1", filename: "Kondapur_3BHK_Price_Sheet_2026.pdf", category: "Price Sheet", size: "1.4 MB", status: "indexed", uploadedAt: "Today, 08:00 AM" },
  { id: "doc-2", filename: "Hyderabad_Prime_Heights_Brochure.pdf", category: "Brochure", size: "8.2 MB", status: "indexed", uploadedAt: "Yesterday" },
  { id: "doc-3", filename: "Legal_Clearance_RERA_FAQ.pdf", category: "FAQ & Legal", size: "650 KB", status: "indexed", uploadedAt: "3 days ago" }
];

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(mockDocs);
  const [isUploading, setIsUploading] = useState(false);

  const handleSimulatedUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const newDoc: KnowledgeDoc = {
        id: `doc-${Date.now()}`,
        filename: "New_Project_Amenities_2026.pdf",
        category: "Amenities & FAQs",
        size: "2.1 MB",
        status: "indexed",
        uploadedAt: "Just now"
      };
      setDocs([newDoc, ...docs]);
      setIsUploading(false);
      alert("✅ Document uploaded & indexed into Bolna AI Agent knowledge base!");
    }, 1000);
  };

  return (
    <AppLayout pageTitle="AI Knowledge Base">
      {/* Upload Zone */}
      <div
        className="glass-card"
        style={{
          border: "2px dashed var(--teal-accent)",
          padding: 36,
          textAlign: "center",
          marginBottom: 24,
          background: "linear-gradient(135deg, rgba(20,184,166,0.05), rgba(15,118,110,0.02))"
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Upload Property Docs & Price Sheets</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "6px 0 16px" }}>
          AI automatically indexes PDFs, price sheets, and FAQs to answer customer calls with 97%+ accuracy.
        </p>
        <button onClick={handleSimulatedUpload} disabled={isUploading} className="btn-primary">
          {isUploading ? "Indexing Document..." : "📁 Upload PDF / Brochure"}
        </button>
      </div>

      {/* Indexed Documents Table */}
      <div className="glass-card">
        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>Indexed Knowledge Files</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {docs.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 14,
                borderRadius: 10,
                background: "var(--surface-2)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>📄</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{doc.filename}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{doc.category} • {doc.size} • Uploaded {doc.uploadedAt}</div>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: "var(--teal-light)", color: "var(--teal-dark)" }}>
                ✓ {doc.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
