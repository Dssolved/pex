"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Auth failed");
      }

      localStorage.setItem("pex_token", data.token);
      localStorage.setItem("pex_user", JSON.stringify(data.user));
      router.push("/market");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.badge}>PEX</p>
        <h1 className={styles.title}>Personal Exchange</h1>
        <p className={styles.subtitle}>Login or create an account.</p>

        <div className={styles.switcher}>
          <button
            className={mode === "login" ? styles.activeTab : styles.tab}
            type="button"
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "register" ? styles.activeTab : styles.tab}
            type="button"
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className={styles.input}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="username"
            autoComplete="username"
          />

          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={styles.input}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="**********"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />

          <button className={styles.button} disabled={loading} type="submit">
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Create account"}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
      </section>
    </main>
  );
}
