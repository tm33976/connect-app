import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import { MessageCircle } from "lucide-react";

function AppInner() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        minHeight: "100dvh",
        background: "#141414",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500&family=JetBrains+Mono:wght@400&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        <div style={{
          textAlign: "center",
          animation: "fadeIn .3s ease both",
        }}>
          {/* Icon */}
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: "rgba(61,158,142,0.12)",
            border: "1px solid rgba(61,158,142,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <MessageCircle size={22} color="#3d9e8e" strokeWidth={2} />
          </div>

          {/* App name */}
          <div style={{
            color: "#e8e6e3",
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 4,
            letterSpacing: "-0.2px",
          }}>
            Connect
          </div>

          {/* Status */}
          <div style={{
            color: "#555250",
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 20,
          }}>
            Loading…
          </div>

          {/* Spinner */}
          <div style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "2px solid #2c2c2c",
            borderTopColor: "#3d9e8e",
            animation: "spin .75s linear infinite",
            margin: "0 auto",
          }} />
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <SocketProvider>
      <ChatPage />
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}