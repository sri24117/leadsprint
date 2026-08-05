"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@leadsprint.local");
  const [password, setPassword] = useState("LeadSprint@123");
  const [status, setStatus] = useState("Use the seeded pilot credentials.");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Signing in...");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus(data.error ?? "Login failed");
      return;
    }
    window.location.href = "/";
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-mark">LS</div>
        <h1>LeadSprint</h1>
        <p>Sign in to your real estate AI caller workspace.</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button type="submit">Sign in</button>
        </form>
        <span>{status}</span>
      </section>
    </main>
  );
}
