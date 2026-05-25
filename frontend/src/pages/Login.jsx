import { BrainCircuit, Lock, Mail, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: ""
  });

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register({ ...form, role });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed");
    }
  }

  return (
    <main className="grid min-h-screen bg-ink text-slate-100 lg:grid-cols-[1fr_0.9fr]">
      <section className="hidden border-r border-line bg-panel/50 p-10 lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-3 text-white">
          <span className="rounded-lg bg-mint p-2 text-ink">
            <BrainCircuit size={24} />
          </span>
          <span className="text-lg font-semibold">Habit Breaker AI</span>
        </Link>
        <div>
          <p className="text-sm uppercase tracking-wide text-mint">Secure workspace</p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-tight text-white">
            Sign in to monitor focus, enforce boundaries, and protect family screen time.
          </h1>
          <p className="mt-4 max-w-lg text-slate-400">
            JWT authentication, bcrypt password storage, role-based access, secure cookies, and CSRF-aware session handling are built into the backend.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <form onSubmit={submit} className="surface w-full max-w-md rounded-lg p-6">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-wide text-mint">{mode === "login" ? "Welcome back" : "Create account"}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{mode === "login" ? "Login" : "Register"}</h2>
          </div>

          {mode === "register" ? (
            <>
              <label className="mb-4 block">
                <span className="mb-2 block text-sm text-slate-300">Full name</span>
                <input className="input" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
              </label>
              <label className="mb-4 block">
                <span className="mb-2 block text-sm text-slate-300">Role</span>
                <select className="input" value={role} onChange={(event) => setRole(event.target.value)}>
                  <option value="user">User</option>
                  <option value="parent">Parent</option>
                </select>
              </label>
            </>
          ) : null}

          <label className="mb-4 block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <Mail size={15} />
              Email
            </span>
            <input className="input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="mb-4 block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <Lock size={15} />
              Password
            </span>
            <input className="input" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </label>

          {error ? <p className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}

          <button className="button-primary w-full">
            {mode === "login" ? <Lock size={16} /> : <UserPlus size={16} />}
            {mode === "login" ? "Login" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="mt-4 w-full text-sm text-mint hover:text-teal-200"
          >
            {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
