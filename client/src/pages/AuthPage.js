import { useState } from "react";
import { login, register } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, User, Info, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

const TEST_ACCOUNTS = [
  { name: "Tester", email: "tester@123.com", password: "Test@123", about: "Test account" },
  { name: "Viewer", email: "viewer@123.com", password: "View@123", about: "Viewer account" },
];


const T = {
  bg0: "#141414",
  bg1: "#1c1c1c",
  bg2: "#242424",
  bg3: "#2c2c2c",
  border: "#333333",
  borderFocus: "#3d9e8e",
  textPrimary: "#e8e6e3",
  textSecondary: "#8a8582",
  textMuted: "#555250",
  accent: "#3d9e8e",
  accentDark: "#2e7a6c",
  accentLight: "rgba(61,158,142,0.12)",
  danger: "#c0504a",
  dangerBg: "rgba(192,80,74,0.1)",
  dangerBorder: "rgba(192,80,74,0.25)",
  online: "#4caf82",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { -webkit-text-size-adjust: 100%; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes spin   { to { transform: rotate(360deg) } }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }

  .auth-root {
    min-height: 100vh;
    min-height: 100dvh;
    background: ${T.bg0};
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Sans', sans-serif;
    padding: 20px 16px;
  }

  .auth-card {
    width: 100%;
    max-width: 400px;
    background: ${T.bg1};
    border: 1px solid ${T.border};
    border-radius: 12px;
    padding: 32px 28px;
    animation: fadeUp .28s ease both;
  }

  /* Logo mark */
  .auth-logo-mark {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: ${T.accentLight};
    border: 1px solid rgba(61,158,142,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 14px;
  }

  /* Tab row */
  .auth-tabs {
    display: flex;
    background: ${T.bg2};
    border: 1px solid ${T.border};
    border-radius: 8px;
    padding: 3px;
    margin-bottom: 24px;
  }
  .auth-tab {
    flex: 1;
    padding: 8px 10px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    transition: background .14s, color .14s;
    -webkit-tap-highlight-color: transparent;
  }
  .auth-tab.active {
    background: ${T.accent};
    color: #fff;
    font-weight: 600;
  }
  .auth-tab.inactive {
    background: transparent;
    color: ${T.textSecondary};
  }
  .auth-tab.inactive:hover {
    color: ${T.textPrimary};
    background: ${T.bg3};
  }

  /* Input */
  .auth-field { margin-bottom: 16px; }
  .auth-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: ${T.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 6px;
  }
  .auth-input-wrap { position: relative; }
  .auth-input {
    width: 100%;
    padding: 10px 13px;
    background: ${T.bg2};
    border: 1px solid ${T.border};
    border-radius: 7px;
    color: ${T.textPrimary};
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    transition: border-color .15s, background .15s;
    -webkit-appearance: none;
    appearance: none;
  }
  .auth-input:focus {
    outline: none;
    border-color: ${T.borderFocus};
    background: ${T.bg1};
  }
  .auth-input::placeholder { color: ${T.textMuted}; }
  .auth-input.has-toggle { padding-right: 40px; }

  .toggle-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: ${T.textMuted};
    display: flex;
    align-items: center;
    padding: 3px;
    border-radius: 4px;
    transition: color .12s;
    -webkit-tap-highlight-color: transparent;
  }
  .toggle-btn:hover { color: ${T.textSecondary}; }

  /* Error */
  .auth-error {
    background: ${T.dangerBg};
    border: 1px solid ${T.dangerBorder};
    border-radius: 7px;
    padding: 10px 12px;
    color: #e07c78;
    font-size: 13px;
    margin-bottom: 18px;
    line-height: 1.5;
    animation: fadeIn .15s ease;
  }

  /* Submit */
  .auth-submit {
    width: 100%;
    padding: 11px;
    border-radius: 7px;
    border: none;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    margin-top: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: background .14s, transform .1s;
    -webkit-tap-highlight-color: transparent;
    min-height: 44px;
    background: ${T.accent};
  }
  .auth-submit:hover:not(:disabled) {
    background: ${T.accentDark};
  }
  .auth-submit:active:not(:disabled) { transform: scale(0.99); }
  .auth-submit:disabled { background: ${T.bg3}; color: ${T.textMuted}; cursor: default; }

  /* Divider */
  .auth-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 20px 0 16px;
  }
  .auth-divider-line { flex: 1; height: 1px; background: ${T.border}; }
  .auth-divider-text { font-size: 11px; color: ${T.textMuted}; font-family: 'JetBrains Mono', monospace; }

  /* Test credentials section */
  .test-creds {
    background: ${T.bg2};
    border: 1px solid ${T.border};
    border-radius: 8px;
    padding: 14px;
  }
  .test-creds-label {
    font-size: 10px;
    font-weight: 600;
    color: ${T.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.7px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'JetBrains Mono', monospace;
  }

  .fill-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 10px;
    border-radius: 7px;
    cursor: pointer;
    background: ${T.bg1};
    border: 1px solid ${T.border};
    margin-bottom: 7px;
    transition: background .12s, border-color .12s;
    -webkit-tap-highlight-color: transparent;
  }
  .fill-card:hover { background: ${T.bg3}; border-color: #3d3d3d; }
  .fill-card:last-child { margin-bottom: 0; }

  .fill-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
  }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .auth-root {
      align-items: flex-start;
      padding: 0;
    }
    .auth-card {
      max-width: 100%;
      min-height: 100vh;
      min-height: 100dvh;
      border-radius: 0;
      border: none;
      padding: 52px 20px 32px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .auth-input { font-size: 16px; padding: 12px 13px; }
    .auth-input.has-toggle { padding-right: 42px; }
    .auth-submit { min-height: 48px; font-size: 15px; padding: 13px; }
    .auth-tab { padding: 9px 8px; font-size: 13px; }
  }

  @media (min-width: 481px) and (max-width: 768px) {
    .auth-card { max-width: 90%; padding: 28px 22px; }
    .auth-input { font-size: 16px; }
  }
`;


const avatarColors = ["#7b6fa0","#4e8c7a","#b56b3a","#5a7fb5","#9e5b5b","#3d7a6e"];
const getColor = (name = "") => avatarColors[name.charCodeAt(0) % avatarColors.length];
const initials = (n = "") => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

export default function AuthPage() {
  const { loginUser } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", about: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setErr(""); setLoading(true);
    try {
      if (mode === "login") {
        try {
          const { data } = await login({ email: form.email, password: form.password });
          loginUser(data.user, data.token);
        } catch (loginErr) {
          const testAcct = TEST_ACCOUNTS.find(a => a.email === form.email && a.password === form.password);
          if (testAcct) {
            try {
              const { data } = await register(testAcct);
              loginUser(data.user, data.token);
            } catch {
              setErr(loginErr.response?.data?.error || "Invalid email or password.");
            }
          } else {
            setErr(loginErr.response?.data?.error || "Invalid email or password.");
          }
        }
      } else {
        const { data } = await register({ name: form.name, email: form.email, password: form.password, about: form.about });
        loginUser(data.user, data.token);
      }
    } catch (e) {
      setErr(e.response?.data?.error || "Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  const fields = mode === "register"
    ? [
        { key: "name",     label: "Display Name",    type: "text",     ph: "Your full name" },
        { key: "email",    label: "Email Address",    type: "email",    ph: "you@email.com" },
        { key: "password", label: "Password",         type: "password", ph: "At least 6 characters" },
        { key: "about",    label: "About (optional)", type: "text",     ph: "Hey there! I'm using Connect." },
      ]
    : [
        { key: "email",    label: "Email Address",    type: "email",    ph: "you@email.com" },
        { key: "password", label: "Password",         type: "password", ph: "Enter your password" },
      ];

  return (
    <div className="auth-root">
      <style>{CSS}</style>

      <div className="auth-card">

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="auth-logo-mark">
            <MessageCircle size={22} color={T.accent} strokeWidth={2} />
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 22, fontWeight: 700,
            color: T.textPrimary, letterSpacing: "-0.3px",
          }}>Connect</div>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
            real-time messaging
          </div>
        </div>

        {/* Mode tabs */}
        <div className="auth-tabs">
          {["login", "register"].map(m => (
            <button
              key={m}
              className={`auth-tab ${mode === m ? "active" : "inactive"}`}
              onClick={() => { setMode(m); setErr(""); setShowPw(false); }}
            >
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {/* Error */}
        {err && <div className="auth-error">{err}</div>}

        {/* Fields */}
        {fields.map(({ key, label, type, ph }) => {
          const isPw = key === "password";
          const inputType = isPw ? (showPw ? "text" : "password") : type;
          return (
            <div key={key} className="auth-field">
              <label className="auth-label">{label}</label>
              <div className="auth-input-wrap">
                <input
                  className={`auth-input${isPw ? " has-toggle" : ""}`}
                  type={inputType}
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={ph}
                  autoComplete={isPw ? (mode === "login" ? "current-password" : "new-password") : key === "email" ? "email" : "off"}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
                {isPw && (
                  <button
                    className="toggle-btn"
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    tabIndex={-1}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Submit */}
        <button
          className="auth-submit"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <><Loader2 size={15} style={{ animation: "spin .7s linear infinite" }} /> Please wait…</>
            : <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={15} /></>
          }
        </button>

        {/* Switch mode link */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: T.textSecondary }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: T.accent, fontWeight: 600, fontSize: 13,
              fontFamily: "'DM Sans', sans-serif", padding: 0,
              transition: "color .12s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = T.accentDark}
            onMouseLeave={e => e.currentTarget.style.color = T.accent}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </div>

        {/* Test credentials */}
        {mode === "login" && (
          <>
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <div className="auth-divider-text">test accounts</div>
              <div className="auth-divider-line" />
            </div>

            <div className="test-creds">
              <div className="test-creds-label">
                <Info size={11} style={{ color: T.textMuted }} />
                Quick fill
              </div>
              {TEST_ACCOUNTS.map(acct => (
                <div
                  key={acct.email}
                  className="fill-card"
                  onClick={() => { setForm(f => ({ ...f, email: acct.email, password: acct.password })); setErr(""); }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div
                      className="fill-avatar"
                      style={{ background: getColor(acct.name) }}
                    >
                      {initials(acct.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: T.textPrimary, fontSize: 13 }}>{acct.name}</div>
                      <div style={{ color: T.textMuted, fontSize: 11, marginTop: 1, fontFamily: "'JetBrains Mono', monospace" }}>{acct.email}</div>
                    </div>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 3,
                    color: T.accent, fontSize: 12, fontWeight: 500, flexShrink: 0,
                  }}>
                    Fill <ArrowRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}