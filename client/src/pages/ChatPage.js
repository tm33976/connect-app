import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  searchUsers, getConversations, startConversation,
  getMessages, sendMessage, markRead, updateProfile,
  uploadAvatar, removeAvatar,
} from "../utils/api";
import {
  Pencil, LogOut, Search, Send, Info, ArrowLeft,
  Smile, ThumbsUp, Heart, CheckCheck, Check,
  MessageSquare, Users, Loader2, Paperclip, X,
  FileText, Download, File, Hash, ChevronRight,
} from "lucide-react";


const fmt = ts => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDate = ts => {
  const d = new Date(ts), now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
};
const initials = (n = "") => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
const timeAgo = date => {
  if (!date) return "";
  const d = Date.now() - new Date(date).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
const fmtSize = b => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const $ = {
  s0: "#111018",   
  s1: "#18161f",   
  s2: "#1f1d27",   
  s3: "#272433",   
  s4: "#302d3e",   
  b1: "#2a2733",   
  b2: "#353145",   
  b3: "#423e52",  
  em:  "#f97316",
  emD: "#c2580d",  
  emL: "#fb923c",  
  emBg:"rgba(249,115,22,0.1)",
  emRim:"rgba(249,115,22,0.25)",
  me:  "#2d3a5e",
  meT: "#c8d4f0",
  t1:  "#ede9f7",   
  t2:  "#8b8499",   
  t3:  "#4a4559",  
  on:  "#34d399",   
  err: "#f87171",   
};

const FONTS = `
  @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500,400&f[]=instrument-sans@400,500,600&display=swap');
`;

const CSS = `
  ${FONTS}

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { overflow: hidden; -webkit-text-size-adjust: 100%; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${$.b2}; border-radius: 2px; }

  /* ── Keyframes — lean, purposeful ── */
  @keyframes slideUp   { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn    { from { opacity:0 } to { opacity:1 } }
  @keyframes slideInR  { from { opacity:0; transform:translateX(16px)} to { opacity:1; transform:translateX(0)} }
  @keyframes popIn     { from { opacity:0; transform:scale(.94) translateY(6px)} to { opacity:1; transform:scale(1) translateY(0)} }
  @keyframes spin      { to { transform: rotate(360deg) } }
  @keyframes breathe   { 0%,100%{opacity:1} 50%{opacity:.2} }
  @keyframes bob       { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }

  .R {
    display: flex;
    height: 100vh; height: 100dvh;
    overflow: hidden;
    background: ${$.s0};
    font-family: 'Instrument Sans', system-ui, sans-serif;
    color: ${$.t1};
    letter-spacing: -0.01em;
  }

  .sidebar-shell {
    display: flex;
    height: 100%;
    flex-shrink: 0;
    border-right: 1px solid ${$.b2};
  }


  .rail {
    width: 56px;
    background: ${$.s1};
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 0;
    gap: 4px;
    border-right: 1px solid ${$.b1};
    flex-shrink: 0;
  }

  /* List pane */
  .list-pane {
    width: 256px;
    background: ${$.s1};
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: ${$.s0};
    min-width: 0;
  }

  .rail-btn {
    width: 40px; height: 40px;
    border-radius: 10px;
    border: none;
    background: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: ${$.t3};
    transition: background .15s, color .15s;
    -webkit-tap-highlight-color: transparent;
    position: relative;
  }
  .rail-btn:hover { background: ${$.s3}; color: ${$.t2}; }
  .rail-btn.on { background: ${$.emBg}; color: ${$.em}; }
  .rail-btn.on::before {
    content: '';
    position: absolute;
    left: -8px; top: 50%; transform: translateY(-50%);
    width: 3px; height: 20px;
    background: ${$.em};
    border-radius: 0 2px 2px 0;
  }

  .crow {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 8px;
    margin: 0 6px 1px;
    transition: background .12s;
    position: relative;
  }
  .crow:hover { background: ${$.s3}; }
  .crow.on { background: ${$.s4}; }
  .crow.on::before {
    content: '';
    position: absolute;
    left: 0; top: 50%; transform: translateY(-50%);
    width: 2px; height: 60%;
    background: ${$.em};
    border-radius: 0 2px 2px 0;
  }

  .ib {
    background: none; border: none;
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    padding: 6px; cursor: pointer;
    color: ${$.t3};
    transition: background .13s, color .13s;
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;
  }
  .ib:hover { color: ${$.t1}; background: ${$.s3}; }
  .ib.red:hover { color: ${$.err}; background: rgba(248,113,113,.1); }
  .ib.on { color: ${$.em}; background: ${$.emBg}; }

  .field {
    background: ${$.s0};
    border: 1px solid ${$.b2};
    border-radius: 7px;     
    color: ${$.t1};
    font-family: 'Instrument Sans', system-ui, sans-serif;
    font-size: 13.5px;
    letter-spacing: -0.01em;
    transition: border-color .15s;
  }
  .field:focus { outline: none; border-color: ${$.em}; }
  .field::placeholder { color: ${$.t3}; }

  .av { position: relative; flex-shrink: 0; user-select: none; }
  .av-inner {
    border-radius: 8px;     /* Square avatars — distinctive */
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cabinet Grotesk', sans-serif;
    font-weight: 700;
    color: #fff;
  }
  .av-dot {
    position: absolute;
    bottom: -2px; right: -2px;
    width: 8px; height: 8px;
    border-radius: 3px;
    border: 2px solid ${$.s1};
  }

  .bme {
    background: ${$.me};
    color: ${$.meT};
    border-radius: 12px 3px 12px 12px;
    font-size: 14px; line-height: 1.55;
  }
  .bthem {
    background: ${$.s3};
    color: ${$.t1};
    border: 1px solid ${$.b1};
    border-radius: 3px 12px 12px 12px;
    font-size: 14px; line-height: 1.55;
  }

  .sbtn {
    height: 38px;
    padding: 0 16px;
    border-radius: 8px;
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    flex-shrink: 0;
    font-family: 'Instrument Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
    transition: all .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .sbtn.on { background: ${$.em}; color: #fff; }
  .sbtn.on:hover { background: ${$.emL}; transform: translateY(-1px); }
  .sbtn.off { background: ${$.s3}; color: ${$.t3}; cursor: default; }

  .info-panel {
    width: 220px; min-width: 220px;
    background: ${$.s1};
    border-left: 1px solid ${$.b2};
    overflow-y: auto;
    flex-shrink: 0;
    animation: slideInR .18s ease;
  }
  .bkdrop {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,.75);
    z-index: 98;
    -webkit-tap-highlight-color: transparent;
  }
  .typing-wrap {
    background: ${$.s3};
    border: 1px solid ${$.b1};
    border-radius: 3px 12px 12px 12px;
    padding: 11px 14px;
    display: inline-flex; gap: 4px; align-items: center;
  }

  .cg { font-family: 'Cabinet Grotesk', sans-serif; }

  @media (max-width: 767px) {
    .sidebar-shell {
      position: fixed; inset: 0;
      z-index: 99;
      transform: translateX(-100%);
      transition: transform .24s cubic-bezier(.4,0,.2,1);
    }
    .sidebar-shell.open { transform: translateX(0); }
    .bkdrop      { display: block; }
    .info-panel  { display: none !important; }
    .emoji-row   { display: none !important; }
    .hint-text   { display: none !important; }
    .hdr-search  { display: none !important; }
    .rail        { display: none; }
    .list-pane   { width: 100vw; }
  }

  @media (max-width: 479px) {
    .chat-hdr  { padding: 10px 12px !important; }
    .msg-area  { padding: 12px 10px 6px !important; }
    .input-bar { padding: 7px 10px 10px !important; }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .list-pane   { width: 220px; }
    .info-panel  { width: 196px; min-width: 196px; }
    .emoji-row   { display: none !important; }
  }
  .bw { max-width: min(64%, 460px); }
  @media(max-width:767px) { .bw { max-width: 78%; } }
  @media(max-width:479px) { .bw { max-width: 86%; } }

  @media(max-width:767px) { .mob-open { display: block !important; } }
  @media(max-width:767px) { .back-b   { display: flex  !important; } }

  @media (min-width: 1440px) {
    .list-pane { width: 280px; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("connect-chat-css")) {
  const el = document.createElement("style");
  el.id = "connect-chat-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

const AV_MAP = [
  "#5c4b7a","#3b5a6e","#5a4a3a","#3a5a4a",
  "#6e3b4a","#3a4a6e","#5a5a3a","#4a3a6e",
];
const AV_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Avatar({ user, size = 38, dot, online }) {
  const idx = (user?.name?.charCodeAt(0) || 0) % AV_MAP.length;
  const bg  = AV_MAP[idx];
  const photoUrl = user?.avatar
    ? (user.avatar.startsWith("http") ? user.avatar : `${AV_BASE}${user.avatar}`)
    : null;
  return (
    <div className="av" style={{ width: size, height: size }}>
      {photoUrl ? (
        <img src={photoUrl} alt={user?.name}
          style={{ width: size, height: size, borderRadius: 8, objectFit: "cover", display: "block" }}
          onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
        />
      ) : null}
      <div className="av-inner" style={{
        width: size, height: size,
        background: bg,
        fontSize: size * 0.37,
        letterSpacing: 0,
        display: photoUrl ? "none" : "flex",
      }}>
        {initials(user?.name)}
      </div>
      {dot && (
        <div className="av-dot" style={{
          background: online ? $.on : $.t3,
          borderColor: $.s1,
        }} />
      )}
    </div>
  );
}


function RailAvatar({ user }) {
  const idx = (user?.name?.charCodeAt(0) || 0) % AV_MAP.length;
  const photoUrl = user?.avatar
    ? (user.avatar.startsWith("http") ? user.avatar : `${AV_BASE}${user.avatar}`)
    : null;
  return (
    <div style={{ width: 32, height: 32, borderRadius: 9, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      {photoUrl && (
        <img src={photoUrl} alt={user?.name}
          style={{ width: 32, height: 32, objectFit: "cover", display: "block", position: "absolute", inset: 0 }}
          onError={e => e.target.style.display = "none"}
        />
      )}
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: AV_MAP[idx],
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: "#fff",
        fontFamily: "'Cabinet Grotesk', sans-serif",
      }}>
        {initials(user?.name)}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="typing-wrap">
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 5, height: 5, borderRadius: 3,
          background: $.em,
          animation: "bob 1s ease-in-out infinite",
          animationDelay: `${i * 0.13}s`,
          opacity: 0.8,
        }} />
      ))}
    </div>
  );
}

function FileBadge({ file, onRemove }) {
  const isImg = file.type.startsWith("image/");
  const isVid = file.type.startsWith("video/");
  const prev  = (isImg || isVid) ? URL.createObjectURL(file) : null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      background: $.emBg, border: `1px solid ${$.emRim}`,
      borderRadius: 7, padding: "7px 10px", marginBottom: 7,
      animation: "fadeIn .15s ease",
    }}>
      {isImg && prev
        ? <img src={prev} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 5, flexShrink: 0 }} />
        : isVid && prev
        ? <video src={prev} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 5, flexShrink: 0 }} />
        : <div style={{ width: 36, height: 36, borderRadius: 5, background: $.s3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={17} style={{ color: $.em }} />
          </div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: $.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
        <div style={{ fontSize: 11, color: $.t3, marginTop: 1, fontVariantNumeric: "tabular-nums" }}>{fmtSize(file.size)}</div>
      </div>
      <button onClick={onRemove} style={{ background: "none", border: "none", borderRadius: 5, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: $.t3, flexShrink: 0, transition: "color .12s" }}
        onMouseEnter={e => e.currentTarget.style.color = $.err}
        onMouseLeave={e => e.currentTarget.style.color = $.t3}
      ><X size={12} /></button>
    </div>
  );
}

function AttBubble({ att, isMe, onImgLoad }) {
  const url = att.url?.startsWith("http") ? att.url : `${API_BASE}${att.url}`;

  if (att.fileType === "image") return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
      <img
        src={url}
        alt={att.originalName}
        loading="eager"
        decoding="async"
        style={{ maxWidth: "100%", maxHeight: 320, width: "auto", borderRadius: 8, display: "block", objectFit: "contain", background: $.s2, border: `1px solid ${$.b2}` }}
        onLoad={onImgLoad}
        onError={e => {
          e.target.parentElement.innerHTML =
            `<a href="${url}" download="${att.originalName}" target="_blank"
              style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:${$.s3};border-radius:8px;color:${$.t2};font-size:12.5px;text-decoration:none;border:1px solid ${$.b2}">
              🖼️ <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${att.originalName}</span>
            </a>`;
        }}
      />
    </a>
  );

  if (att.fileType === "video") return (
    <video src={url} controls preload="metadata"
      style={{ maxWidth: "100%", borderRadius: 8, display: "block", border: `1px solid ${$.b2}`, background: "#000" }}
      onError={e => {
        e.target.outerHTML =
          `<a href="${url}" download="${att.originalName}" target="_blank"
            style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:${$.s3};border-radius:8px;color:${$.t2};font-size:12.5px;text-decoration:none;border:1px solid ${$.b2}">
            🎥 <span>${att.originalName}</span>
          </a>`;
      }}
    />
  );
  const iconC = { "application/pdf": "#f87171", "application/msword": "#93c5fd", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "#93c5fd", "application/vnd.ms-excel": "#6ee7b7", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "#6ee7b7" }[att.mimetype] || $.em;
  return (
    <a href={url} download={att.originalName} target="_blank" rel="noreferrer"
      style={{ display: "flex", alignItems: "center", gap: 9, background: isMe ? "rgba(255,255,255,.06)" : $.s4, borderRadius: 8, padding: "9px 11px", textDecoration: "none", border: `1px solid ${$.b1}`, transition: "background .12s" }}
      onMouseEnter={e => e.currentTarget.style.background = isMe ? "rgba(255,255,255,.1)" : $.b2}
      onMouseLeave={e => e.currentTarget.style.background = isMe ? "rgba(255,255,255,.06)" : $.s4}
    >
      <div style={{ width: 32, height: 32, borderRadius: 6, background: isMe ? "rgba(255,255,255,.1)" : $.s2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FileText size={16} style={{ color: iconC }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: isMe ? $.meT : $.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.originalName}</div>
        <div style={{ fontSize: 11, color: isMe ? "rgba(200,212,240,.5)" : $.t3, marginTop: 1, fontVariantNumeric: "tabular-nums" }}>{fmtSize(att.size)}</div>
      </div>
      <Download size={13} style={{ color: isMe ? "rgba(200,212,240,.5)" : $.t3, flexShrink: 0 }} />
    </a>
  );
}

export default function ChatPage() {
  const { user: me, logoutUser, updateUser } = useAuth();
  const { onlineUsers, typingUsers, emitTypingStart, emitTypingStop, onNewMessage, onMessagesRead } = useSocket();

  const [convs, setConvs]   = useState([]);
  const [users, setUsers]   = useState([]);
  const [active, setActive] = useState(null);
  const [tab, setTab]       = useState("chats");
  const [text, setText]     = useState("");
  const [file, setFile]     = useState(null);
  const [q, setQ]           = useState("");
  const [mq, setMq]         = useState("");
  const [showMq, setShowMq] = useState(false);
  const [hasMore, setMore]  = useState(false);
  const [pg, setPg]         = useState(1);
  const [info, setInfo]     = useState(false);
  const [nav, setNav]       = useState(false);
  const [editing, setEdit]  = useState(false);
  const [pf, setPf]         = useState({ name: me?.name, about: me?.about });
  const [avPreview, setAvPreview] = useState(null);   
  const [avUploading, setAvUploading] = useState(false);
  const [sending, setSend]  = useState(false);
  const [mob, setMob]       = useState(window.innerWidth < 768);

  const endRef   = useRef(null);
  const tRef     = useRef(null);
  const fileRef  = useRef(null);
  const avRef    = useRef(null);

  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => { loadConvs(); }, []);
  useEffect(() => { if (tab === "contacts") loadUsers(); }, [tab, q]);

  const loadConvs = useCallback(async () => {
    try { const { data } = await getConversations(); setConvs(data.conversations); } catch {}
  }, []);

  const loadConvsDebounceRef = useRef(null);
  const loadConvsDebounced = useCallback(() => {
    clearTimeout(loadConvsDebounceRef.current);
    loadConvsDebounceRef.current = setTimeout(loadConvs, 400);
  }, [loadConvs]);
  const loadUsers = useCallback(async () => { try { const { data } = await searchUsers(q); setUsers(data.users); } catch {} }, [q]);

  useEffect(() => onNewMessage(({ message, conversationId }) => {
    if (active?.conversation?._id === conversationId) {
      setActive(p => ({ ...p, messages: [...p.messages, message] }));
      markRead(conversationId).catch(() => {});
    }
    loadConvsDebounced();
  }), [active, onNewMessage, loadConvsDebounced]);

  useEffect(() => onMessagesRead(({ conversationId }) => {
    if (active?.conversation?._id === conversationId)
      setActive(p => ({ ...p, messages: p.messages.map(m => m.sender?._id === me._id ? { ...m, status: "read" } : m) }));
  }), [active, onMessagesRead, me._id]);

  const msgsRef = useRef(null); 
  const scrollToBottom = useCallback((smooth = true) => {
    const el = msgsRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "instant" });
  }, []);
  useEffect(() => {
    if (active?.messages) scrollToBottom(false);
  }, [active?.conversation?._id]);  
  useEffect(() => {
    scrollToBottom(true);
  }, [active?.messages?.length, typingUsers]);

  const openConv = async uid => {
    try {
      const { data: cd } = await startConversation(uid);
      const conv = cd.conversation;
      const other = conv.participants.find(p => p._id !== me._id);
      const { data: md } = await getMessages(conv._id);
      setActive({ conversation: conv, messages: md.messages, otherUser: other });
      setMore(md.hasMore); setPg(1);
      await markRead(conv._id).catch(() => {});
      await loadConvs();
      if (mob) setNav(false);
    } catch (e) { console.error(e); }
  };

  const loadMore = async () => {
    if (!hasMore || !active) return;
    const n = pg + 1;
    try {
      const { data } = await getMessages(active.conversation._id, n);
      setActive(p => ({ ...p, messages: [...data.messages, ...p.messages] }));
      setMore(data.hasMore); setPg(n);
    } catch {}
  };

  const onType = e => {
    setText(e.target.value);
    if (!active) return;
    emitTypingStart(active.conversation._id, active.otherUser._id);
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => emitTypingStop(active.conversation._id, active.otherUser._id), 3000); // 3s — more forgiving on mobile keyboards
  };

  const pickFile = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { alert("Max 50 MB"); return; }
    setFile(f); e.target.value = "";
  };

  const doSend = async () => {
    if ((!text.trim() && !file) || !active || sending) return;
    const t = text.trim(), f = file;
    setText(""); setFile(null); setSend(true);
    const opt = {
      _id: `opt_${Date.now()}`,
      sender: { _id: me._id, name: me.name, avatarColor: me.avatarColor },
      text: t, status: "sent", createdAt: new Date().toISOString(),
      attachment: f ? {
        fileType: f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : "document",
        originalName: f.name, size: f.size, mimetype: f.type,
        url: (f.type.startsWith("image/") || f.type.startsWith("video/")) ? URL.createObjectURL(f) : null,
        _optimistic: true,
      } : null,
    };
    setActive(p => ({ ...p, messages: [...p.messages, opt] }));
    try {
      const { data } = await sendMessage(active.conversation._id, t || "", f || null);
      setActive(p => ({ ...p, messages: p.messages.map(m => m._id === opt._id ? data.message : m) }));
      await loadConvs();
    } catch (e) {
      setActive(p => ({ ...p, messages: p.messages.filter(m => m._id !== opt._id) }));
      setText(t); setFile(f);
      alert(e.response?.data?.error || "Failed to send");
    } finally { setSend(false); }
  };

  const saveProfile = async () => {
    try { const { data } = await updateProfile(pf); updateUser(data.user); setEdit(false); } catch {}
  };

  const handleAvPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { alert("Avatar max 5 MB"); return; }
    const local = URL.createObjectURL(f);
    setAvPreview(local);
    setAvUploading(true);
    try {
      const { data } = await uploadAvatar(f);
      updateUser(data.user);
      setAvPreview(null);
    } catch { setAvPreview(null); alert("Upload failed"); }
    finally { setAvUploading(false); }
    e.target.value = "";
  };

  const handleAvRemove = async () => {
    setAvUploading(true);
    try {
      const { data } = await removeAvatar();
      updateUser(data.user);
      setAvPreview(null);
    } catch { alert("Failed to remove avatar"); }
    finally { setAvUploading(false); }
  };
  const fConvs = useMemo(() =>
    convs.filter(conv => {
      const o = conv.participants.find(p => p._id !== me._id);
      return o?.name?.toLowerCase().includes(q.toLowerCase());
    }), [convs, q, me._id]);

  const fUsers = useMemo(() =>
    users.filter(u =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase())
    ), [users, q]);

  const msgs = useMemo(() =>
    active
      ? (mq ? active.messages.filter(m => m.text?.toLowerCase().includes(mq.toLowerCase())) : active.messages)
      : []
  , [active?.messages, mq]);

  const grouped = useMemo(() =>
    msgs.reduce((a, m) => {
      const d = fmtDate(m.createdAt); if (!a[d]) a[d] = []; a[d].push(m); return a;
    }, {})
  , [msgs]);

  const isTyping    = active ? (typingUsers[active.conversation._id] || []).length > 0 : false;
  const theirOn     = active?.otherUser ? onlineUsers.has(active.otherUser._id) : false;
  const canSend     = !!(text.trim() || file) && !sending;
  const totalUnread = useMemo(() => convs.reduce((s, conv) => s + (conv.unreadCount || 0), 0), [convs]);

  return (
    <div className="R">

      <input ref={fileRef} type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
        style={{ display: "none" }} onChange={pickFile} />

      {mob && nav && <div className="bkdrop" onClick={() => setNav(false)} />}
      <div className={`sidebar-shell${mob && nav ? " open" : ""}`}>
        <div className="rail">
          <div className="cg" style={{ fontSize: 18, fontWeight: 800, color: $.em, marginBottom: 16, letterSpacing: -1 }}>C</div>

          {/* My avatar in rail */}
          <div style={{ position: "relative", marginBottom: 8, cursor: "pointer" }} onClick={() => setEdit(e => !e)} title={me?.name}>
            <RailAvatar user={me} />
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: 3, background: $.on, border: `2px solid ${$.s1}` }} />
          </div>

          <div style={{ width: 28, height: 1, background: $.b2, margin: "6px 0" }} />

          {/* Chats tab */}
          <button className={`rail-btn${tab === "chats" ? " on" : ""}`} onClick={() => setTab("chats")} title="Chats">
            <MessageSquare size={18} />
            {totalUnread > 0 && tab !== "chats" && (
              <span style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, borderRadius: 4, background: $.em, color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </button>

          {/* People tab */}
          <button className={`rail-btn${tab === "contacts" ? " on" : ""}`} onClick={() => setTab("contacts")} title="People">
            <Users size={18} />
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Settings / logout */}
          <button className="rail-btn red" onClick={logoutUser} title="Sign out"
            style={{ color: $.t3 }}
            onMouseEnter={e => { e.currentTarget.style.color = $.err; e.currentTarget.style.background = "rgba(248,113,113,.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = $.t3; e.currentTarget.style.background = "none"; }}
          >
            <LogOut size={17} />
          </button>
        </div>

        {/*  LIST PANE */}
        <div className="list-pane">
          {/* hidden avatar file input */}
          <input ref={avRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvPick} />

          {/* Pane header */}
          <div style={{ padding: "14px 12px 10px", borderBottom: `1px solid ${$.b1}`, flexShrink: 0 }}>
            {editing ? (
              <div style={{ animation: "fadeIn .15s ease" }}>
                <p style={{ fontSize: 10.5, fontWeight: 600, color: $.t3, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".07em" }}>Edit profile</p>

                {/* Avatar picker */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div
                    onClick={() => !avUploading && avRef.current?.click()}
                    style={{ width: 56, height: 56, borderRadius: 10, flexShrink: 0, cursor: "pointer", position: "relative", overflow: "hidden", border: `2px dashed ${$.b3}`, transition: "border-color .15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = $.em}
                    onMouseLeave={e => e.currentTarget.style.borderColor = $.b3}
                    title="Change photo"
                  >
                    {(avPreview || me?.avatar) && (
                      <img src={avPreview || (me.avatar.startsWith("http") ? me.avatar : `${AV_BASE}${me.avatar}`)} alt="avatar"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    )}
                    {!avPreview && !me?.avatar && (
                      <div style={{ width: "100%", height: "100%", background: AV_MAP[(me?.name?.charCodeAt(0)||0) % AV_MAP.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "'Cabinet Grotesk',sans-serif" }}>
                        {initials(me?.name)}
                      </div>
                    )}
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .15s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "0"}
                    >
                      {avUploading ? <Loader2 size={18} style={{ color: "#fff", animation: "spin .7s linear infinite" }} /> : <Pencil size={15} style={{ color: "#fff" }} />}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: $.t1, marginBottom: 5 }}>Profile photo</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => avRef.current?.click()} disabled={avUploading}
                        style={{ padding: "4px 10px", background: $.emBg, border: `1px solid ${$.emRim}`, borderRadius: 5, color: $.em, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans',sans-serif" }}>
                        Upload
                      </button>
                      {me?.avatar && (
                        <button onClick={handleAvRemove} disabled={avUploading}
                          style={{ padding: "4px 10px", background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", borderRadius: 5, color: $.err, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans',sans-serif" }}>
                          Remove
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: $.t3, marginTop: 3 }}>JPG, PNG, WebP · max 5 MB</div>
                  </div>
                </div>

                {[{ k:"name", ph:"Your name" }, { k:"about", ph:"About" }].map(({ k, ph }) => (
                  <input key={k} value={pf[k] || ""} onChange={e => setPf(p => ({ ...p, [k]: e.target.value }))}
                    placeholder={ph} className="field"
                    style={{ width: "100%", padding: "7px 10px", marginBottom: 7 }} />
                ))}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={saveProfile} style={{ flex: 1, padding: "7px", background: $.em, border: "none", borderRadius: 6, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Instrument Sans',sans-serif" }}>Save</button>
                  <button onClick={() => setEdit(false)} style={{ flex: 1, padding: "7px", background: $.s3, border: `1px solid ${$.b2}`, borderRadius: 6, color: $.t2, fontSize: 12.5, cursor: "pointer", fontFamily: "'Instrument Sans',sans-serif" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {/* Section title — Cabinet Grotesk, bold, small */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                  <span className="cg" style={{ fontSize: 15, fontWeight: 700, color: $.t1, letterSpacing: -0.3 }}>
                    {tab === "chats" ? "Messages" : "People"}
                  </span>
                  <button className="ib" onClick={() => setEdit(true)} title="Edit profile"><Pencil size={13} /></button>
                </div>
                <div style={{ position: "relative" }}>
                  <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: $.t3, pointerEvents: "none" }} />
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search"
                    className="field" style={{ width: "100%", padding: "7px 10px 7px 27px", fontSize: 13 }} />
                </div>
              </>
            )}
          </div>

          {/* List body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 0", WebkitOverflowScrolling: "touch" }}>
            {tab === "chats" && (
              fConvs.length === 0
                ? <div style={{ padding: "36px 16px", textAlign: "center", color: $.t3, fontSize: 13, lineHeight: 1.75 }}>
                    No messages yet.<br />Go to People to start one.
                  </div>
                : fConvs.map(conv => {
                    const other = conv.participants.find(p => p._id !== me._id);
                    const isOn  = active?.conversation._id === conv._id;
                    const lm    = conv.lastMessage;
                    const prev  = lm?.attachment?.fileType
                      ? (lm.attachment.fileType === "image" ? "📷 Photo" : lm.attachment.fileType === "video" ? "🎥 Video" : `📎 ${lm.attachment.originalName}`)
                      : (lm?.text || "");
                    return (
                      <div key={conv._id} className={`crow${isOn ? " on" : ""}`} onClick={() => openConv(other._id)}>
                        <Avatar user={other} size={38} dot online={onlineUsers.has(other?._id)} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span className="cg" style={{ fontSize: 13.5, fontWeight: 600, color: $.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: -0.2 }}>{other?.name}</span>
                            {lm && <span style={{ fontSize: 10, color: $.t3, flexShrink: 0, marginLeft: 4, fontVariantNumeric: "tabular-nums" }}>{fmt(lm.createdAt)}</span>}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                            <span style={{ fontSize: 12, color: typingUsers[conv._id]?.length ? $.em : $.t3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "82%" }}>
                              {typingUsers[conv._id]?.length ? "typing…"
                                : lm ? ((lm.sender?._id === me._id || lm.sender?.name === me.name) ? `you: ${prev}` : prev)
                                : "—"}
                            </span>
                            {conv.unreadCount > 0 && !isOn && (
                              <span style={{ minWidth: 16, height: 16, borderRadius: 5, background: $.em, color: "#fff", fontSize: 9.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", flexShrink: 0, letterSpacing: 0 }}>
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
            )}

            {tab === "contacts" && (
              <>
                <div style={{ padding: "4px 12px 3px", fontSize: 10, color: $.t3, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase" }}>
                  {fUsers.length} people
                </div>
                {fUsers.length === 0
                  ? <div style={{ padding: "30px 16px", textAlign: "center", color: $.t3, fontSize: 13 }}>No results</div>
                  : fUsers.map(u => (
                      <div key={u._id} className="crow" onClick={() => openConv(u._id)}>
                        <Avatar user={u} size={36} dot online={onlineUsers.has(u._id)} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="cg" style={{ fontSize: 13.5, fontWeight: 600, color: $.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: -0.2 }}>{u.name}</div>
                          <div style={{ fontSize: 11.5, color: onlineUsers.has(u._id) ? $.on : $.t3, marginTop: 1 }}>
                            {onlineUsers.has(u._id) ? "online" : `${timeAgo(u.lastSeen)}`}
                          </div>
                        </div>
                        <ChevronRight size={13} style={{ color: $.t3, flexShrink: 0 }} />
                      </div>
                    ))
                }
              </>
            )}
          </div>
        </div>
      </div>

      {/*  MAIN PANE */}
      <div className="main">
        {!active ? (
          <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 32 }}>
            {/* Empty state — type-forward, no icons */}
            <div className="cg" style={{ fontSize: 32, fontWeight: 800, color: $.s4, letterSpacing: -1, lineHeight: 1.1, textAlign: "center" }}>
              No chat<br />selected
            </div>
            <div style={{ fontSize: 13.5, color: $.t3, maxWidth: 200, textAlign: "center", lineHeight: 1.65 }}>
              Choose a conversation from the sidebar to get started
            </div>
            <button onClick={() => setNav(true)}
              style={{ marginTop: 10, padding: "9px 20px", background: $.em, border: "none", borderRadius: 7, color: "#fff", fontFamily: "'Instrument Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "none" }}
              className="mob-open">
              Open messages
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="chat-hdr" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderBottom: `1px solid ${$.b2}`, background: $.s1, flexShrink: 0 }}>
              <button className="ib back-b" onClick={() => setNav(true)} style={{ display: "none" }}><ArrowLeft size={17} /></button>

              <Avatar user={active.otherUser} size={34} dot online={theirOn} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="cg" style={{ fontWeight: 700, color: $.t1, fontSize: 14.5, letterSpacing: -0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {active.otherUser?.name}
                </div>
                <div style={{ fontSize: 11, color: isTyping ? $.em : theirOn ? $.on : $.t3, marginTop: 1 }}>
                  {isTyping ? "typing…" : theirOn ? "online" : `last seen ${timeAgo(active.otherUser?.lastSeen)}`}
                </div>
              </div>

              {/* Inline search */}
              <div className="hdr-search" style={{ position: "relative" }}>
                <Search size={11} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: $.t3, pointerEvents: "none" }} />
                <input value={mq} onChange={e => setMq(e.target.value)} placeholder="Search"
                  className="field" style={{ padding: "6px 10px 6px 24px", fontSize: 12, width: 120 }} />
              </div>

              <button className={`ib${showMq ? " on" : ""}`} onClick={() => setShowMq(s => !s)}><Search size={14} /></button>
              <button className={`ib${info ? " on" : ""}`} onClick={() => setInfo(s => !s)}><Info size={14} /></button>
            </div>

            {/* Mobile search bar */}
            {showMq && (
              <div style={{ padding: "7px 13px", borderBottom: `1px solid ${$.b2}`, background: $.s1, flexShrink: 0 }}>
                <div style={{ position: "relative" }}>
                  <Search size={11} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: $.t3, pointerEvents: "none" }} />
                  <input value={mq} onChange={e => setMq(e.target.value)} autoFocus placeholder="Search messages"
                    className="field" style={{ width: "100%", padding: "7px 10px 7px 25px", fontSize: 13 }} />
                </div>
              </div>
            )}

            {/* Messages + info */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
              <div ref={msgsRef} className="msg-area" style={{ flex: 1, overflowY: "auto", padding: "14px 16px 6px", display: "flex", flexDirection: "column", WebkitOverflowScrolling: "touch", minWidth: 0, willChange: "scroll-position" }}>
                {hasMore && (
                  <div style={{ textAlign: "center", marginBottom: 12 }}>
                    <button onClick={loadMore} style={{ padding: "5px 14px", background: $.s3, border: `1px solid ${$.b2}`, borderRadius: 5, color: $.t2, fontSize: 12, cursor: "pointer", fontFamily: "'Instrument Sans',sans-serif" }}>
                      Load earlier
                    </button>
                  </div>
                )}

                {Object.entries(grouped).map(([date, dayMsgs]) => (
                  <div key={date}>
                    {/* Date divider — left-aligned text, not centered pill.
                        More editorial */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 10px" }}>
                      <div style={{ height: 1, background: $.b1, flex: 1 }} />
                      <span style={{ fontSize: 11, color: $.t3, fontWeight: 500, letterSpacing: ".03em" }}>{date}</span>
                      <div style={{ height: 1, background: $.b1, flex: 1 }} />
                    </div>

                    {dayMsgs.map((m, i) => {
                      const isMe   = m.sender?._id === me._id || m.sender === me._id;
                      const consec = i > 0 && (dayMsgs[i-1].sender?._id || dayMsgs[i-1].sender) === (m.sender?._id || m.sender);
                      const hasAtt = !!(m.attachment?.fileType && m.attachment?.url);

                      return (
                        <div key={m._id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginTop: consec ? 2 : 10, animation: "popIn .18s ease both" }}>
                          {!isMe && !consec && <div style={{ marginRight: 7, alignSelf: "flex-end", flexShrink: 0 }}><Avatar user={active.otherUser} size={24} /></div>}
                          {!isMe && consec  && <div style={{ width: 31, flexShrink: 0 }} />}

                          <div className="bw" style={{ minWidth: 0 }}>

                            {hasAtt && (
                              <div style={{ marginBottom: m.text ? 5 : 0 }}>
                                {m.attachment._optimistic ? (
                                  <div style={{ position: "relative" }}>
                                    {m.attachment.url && (m.attachment.fileType === "image" || m.attachment.fileType === "video")
                                      ? m.attachment.fileType === "image"
                                        ? <img src={m.attachment.url} alt="" style={{ maxWidth: "100%", borderRadius: 8, display: "block", opacity: .5 }} />
                                        : <video src={m.attachment.url} style={{ maxWidth: "100%", borderRadius: 8, display: "block", opacity: .5, background: "#000" }} />
                                      : <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", background: $.s3, borderRadius: 7 }}>
                                          <Loader2 size={13} style={{ color: $.em, animation: "spin .8s linear infinite" }} />
                                          <span style={{ fontSize: 12, color: $.t2 }}>Uploading…</span>
                                        </div>
                                    }
                                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "rgba(0,0,0,0.35)" }}>
                                      <Loader2 size={20} style={{ color: "#fff", animation: "spin .8s linear infinite" }} />
                                    </div>
                                  </div>
                                ) : <AttBubble att={m.attachment} isMe={isMe} onImgLoad={() => scrollToBottom(false)} />}
                              </div>
                            )}

                            {m.text && (
                              <div className={isMe ? "bme" : "bthem"} style={{
                                padding: "9px 13px",
                                borderRadius: hasAtt ? "3px 3px 12px 12px" : undefined,
                                wordBreak: "break-word",
                              }}>
                                {m.text.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#x27;/g,"'")}
                              </div>
                            )}

                            {/* Timestamp — always shown, left-aligned on theirs, right on mine */}
                            <div style={{
                              fontSize: 10, color: $.t3, marginTop: 3,
                              textAlign: isMe ? "right" : "left",
                              paddingLeft: isMe ? 0 : 2, paddingRight: isMe ? 2 : 0,
                              display: "flex", alignItems: "center",
                              justifyContent: isMe ? "flex-end" : "flex-start", gap: 3,
                              fontVariantNumeric: "tabular-nums",
                            }}>
                              {fmt(m.createdAt)}
                              {isMe && (m.status === "read"
                                ? <CheckCheck size={10} style={{ color: $.em }} />
                                : m.status === "delivered"
                                ? <CheckCheck size={10} style={{ color: $.t3 }} />
                                : <Check size={10} style={{ color: $.t3 }} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {isTyping && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 7, marginTop: 10 }}>
                    <Avatar user={active.otherUser} size={24} />
                    <TypingBubble />
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Info panel */}
              {info && (
                <div className="info-panel">
                  <div style={{ padding: "18px 14px 14px", borderBottom: `1px solid ${$.b1}` }}>
                    <Avatar user={active.otherUser} size={56} dot online={theirOn} />
                    <div className="cg" style={{ fontWeight: 700, color: $.t1, fontSize: 16, marginTop: 12, letterSpacing: -0.3 }}>{active.otherUser?.name}</div>
                    <div style={{ fontSize: 11.5, color: theirOn ? $.on : $.t3, marginTop: 3 }}>
                      {theirOn ? "Online now" : `Last seen ${timeAgo(active.otherUser?.lastSeen)}`}
                    </div>
                    <div style={{ fontSize: 11, color: $.t3, marginTop: 2, wordBreak: "break-all" }}>{active.otherUser?.email}</div>
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: $.t3, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>About</div>
                    <div style={{ fontSize: 12.5, color: $.t2, lineHeight: 1.55 }}>{active.otherUser?.about || "—"}</div>
                  </div>
                  <div style={{ margin: "0 14px 12px", background: $.s2, borderRadius: 8, padding: "12px", border: `1px solid ${$.b1}`, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: $.t3, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Total messages</div>
                    <div className="cg" style={{ fontSize: 30, fontWeight: 800, color: $.em, letterSpacing: -1 }}>{active.messages.length}</div>
                  </div>
                </div>
              )}
            </div>

            {/*  Input bar */}
            <div className="input-bar" style={{ padding: "8px 13px 11px", borderTop: `1px solid ${$.b2}`, background: $.s1, flexShrink: 0 }}>
              {file && <FileBadge file={file} onRemove={() => setFile(null)} />}

              <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                {/* Emoji row — desktop only */}
                <div className="emoji-row" style={{ display: "flex", gap: 1, alignSelf: "center", flexShrink: 0 }}>
                  {["😊","👍","❤️"].map(e => (
                    <button key={e} onClick={() => setText(v => v + e)}
                      style={{ background: "none", border: "none", padding: "6px 5px", borderRadius: 6, cursor: "pointer", fontSize: 15, lineHeight: 1, opacity: 0.55, transition: "opacity .12s, transform .12s" }}
                      onMouseEnter={ev => { ev.currentTarget.style.opacity = "1"; ev.currentTarget.style.transform = "scale(1.15)"; }}
                      onMouseLeave={ev => { ev.currentTarget.style.opacity = "0.55"; ev.currentTarget.style.transform = "scale(1)"; }}
                    >{e}</button>
                  ))}
                </div>

                {/* Attach */}
                <button className="ib" onClick={() => fileRef.current?.click()} style={{ color: file ? $.em : $.t3, alignSelf: "center" }}
                  onMouseEnter={e => { e.currentTarget.style.color = $.em; e.currentTarget.style.background = $.emBg; }}
                  onMouseLeave={e => { e.currentTarget.style.color = file ? $.em : $.t3; e.currentTarget.style.background = "none"; }}
                ><Paperclip size={16} /></button>

                {/* Textarea */}
                <textarea value={text} onChange={onType}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); } }}
                  placeholder={file ? "Add a caption…" : `Message ${active.otherUser?.name}…`}
                  rows={1}
                  className="field"
                  style={{ flex: 1, padding: "9px 12px", fontSize: 13.5, resize: "none", lineHeight: 1.5, maxHeight: 104, overflowY: "auto", minWidth: 0, borderRadius: 7 }}
                />

                {/* Send — rectangle, not circle */}
                <button onClick={doSend} disabled={!canSend} className={`sbtn${canSend ? " on" : " off"}`}>
                  {sending
                    ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />
                    : <><Send size={14} />Send</>
                  }
                </button>
              </div>

              <div className="hint-text" style={{ fontSize: 10, color: $.t3, marginTop: 5, letterSpacing: ".01em" }}>
                Enter to send · Shift+Enter for newline · max 50 MB
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}