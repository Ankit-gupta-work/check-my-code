import { useState, useRef, useCallback } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

const SEV_COLORS = {
  critical: {
    bg: "rgba(255,51,102,0.12)",
    border: "rgba(255,51,102,0.25)",
    text: "#ff3366",
    badge: "rgba(255,51,102,0.18)",
  },
  high: {
    bg: "rgba(255,107,53,0.10)",
    border: "rgba(255,107,53,0.22)",
    text: "#ff6b35",
    badge: "rgba(255,107,53,0.16)",
  },
  medium: {
    bg: "rgba(255,179,0,0.08)",
    border: "rgba(255,179,0,0.20)",
    text: "#ffb300",
    badge: "rgba(255,179,0,0.14)",
  },
  low: {
    bg: "rgba(0,214,143,0.07)",
    border: "rgba(0,214,143,0.18)",
    text: "#00d68f",
    badge: "rgba(0,214,143,0.12)",
  },
};

function ScoreRing({ score }) {
  const r = 52,
    circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const dash = (pct / 100) * circ;
  const color =
    pct >= 80
      ? "#00d68f"
      : pct >= 60
        ? "#ffb300"
        : pct >= 40
          ? "#ff6b35"
          : "#ff3366";
  return (
    <div
      style={{ position: "relative", width: 136, height: 136, flexShrink: 0 }}
    >
      <svg
        width="136"
        height="136"
        viewBox="0 0 136 136"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="68"
          cy="68"
          r={r}
          fill="none"
          stroke="#1a1d2e"
          strokeWidth="9"
        />
        <circle
          cx="68"
          cy="68"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{
            transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 30,
            fontWeight: 800,
            color,
            lineHeight: 1,
            fontFamily: "'Syne',sans-serif",
          }}
        >
          {pct}
        </span>
        <span
          style={{
            fontSize: 10,
            color: "#3a3e55",
            letterSpacing: "0.12em",
            fontFamily: "'Fira Code',monospace",
            marginTop: 2,
          }}
        >
          SCORE
        </span>
      </div>
    </div>
  );
}

// ✅ FIXED: IssueCard now supports both field name conventions
function IssueCard({ issue, idx, open, onToggle }) {
  const sev = (issue.severity || "low").toLowerCase();
  const col = SEV_COLORS[sev] || SEV_COLORS.low;

  // Support both: title (old) and message (new API)
  const title = issue.title || issue.message;
  // Support both: description (old) and type+line (new API)
  const description =
    issue.description ||
    (issue.type
      ? `Type: ${issue.type}${issue.line ? ` · Line ${issue.line}` : ""}`
      : null);
  // Support both: fix (old) and suggestion (new API)
  const fix = issue.fix || issue.suggestion;

  return (
    <div
      onClick={() => onToggle(idx)}
      style={{
        background: col.bg,
        border: `1px solid ${col.border}`,
        borderRadius: 10,
        padding: "13px 15px",
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 7,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: "'Fira Code',monospace",
            fontWeight: 600,
            letterSpacing: "0.1em",
            padding: "3px 8px",
            borderRadius: 4,
            background: col.badge,
            color: col.text,
          }}
        >
          {sev.toUpperCase()}
        </span>
        <span
          style={{
            fontSize: 11,
            color: "#2a2e40",
            transition: "transform 0.2s",
            display: "inline-block",
            transform: open ? "rotate(180deg)" : "none",
          }}
        >
          ▼
        </span>
      </div>

      {/* Issue title / message */}
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 700,
          color: "#c8d0e8",
          marginBottom: open ? 6 : 0,
        }}
      >
        {title}
      </div>

      {/* Expanded panel */}
      {open && (
        <div style={{ animation: "fadeSlide 0.2s ease" }}>
          {description && (
            <div
              style={{
                fontSize: 12,
                color: "#4a5070",
                fontFamily: "'Fira Code',monospace",
                lineHeight: 1.6,
                marginBottom: 8,
              }}
            >
              {description}
            </div>
          )}
          {fix && (
            <div
              style={{
                padding: "8px 10px",
                background: "rgba(0,214,143,0.06)",
                border: "1px solid rgba(0,214,143,0.12)",
                borderRadius: 7,
                fontSize: 12,
                color: "#00a86b",
                fontFamily: "'Fira Code',monospace",
                lineHeight: 1.6,
              }}
            >
              💡 {fix}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("write");
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openIssue, setOpenIssue] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const loadFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const r = new FileReader();
    r.onload = (e) => {
      setCode(e.target.result);
      setTab("write");
    };
    r.readAsText(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    loadFile(e.dataTransfer.files[0]);
  }, []);

  const reviewCode = async () => {
    if (!code.trim()) return alert("Enter code first");

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      console.log("AI Result:", data);

      // ✅ FIXED: Normalize API response to match UI field names
      // Handles both { score, title, description, fix } and { rating, message, type, line, suggestion }
      const normalized = {
        ...data,
        // "rating" (0–10) → "score" (0–100) for the ScoreRing
        score:
          data.score !== undefined
            ? data.score
            : data.rating !== undefined
              ? data.rating * 10
              : 0,
        issues: (data.issues || []).map((iss) => ({
          severity: iss.severity,
          title: iss.title || iss.message,
          description:
            iss.description ||
            (iss.type
              ? `${iss.type}${iss.line ? ` · Line ${iss.line}` : ""}`
              : undefined),
          fix: iss.fix || iss.suggestion,
        })),
      };

      setResult(normalized);
    } catch (err) {
      console.error("API Error:", err);
      setError(err.message || "Error connecting to backend");
    }
    setLoading(false);
  };

  const lines = code.split("\n");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Syne:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          font-family: 'Syne', sans-serif;
          background: #07090f;
          color: #c8d0e8;
          min-height: 100vh;
        }

        .ca-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #07090f;
          background-image:
            radial-gradient(ellipse 60% 40% at 15% 60%, rgba(0,229,255,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 50% 35% at 85% 15%, rgba(255,107,53,0.04) 0%, transparent 60%);
        }

        .ca-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 40px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .ca-logo { display: flex; align-items: center; gap: 12px; }
        .ca-logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #00e5ff 0%, #006aff 100%);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; box-shadow: 0 0 20px rgba(0,229,255,0.25);
        }
        .ca-logo h1 { font-size: 19px; font-weight: 800; color: #fff; letter-spacing: -0.4px; }
        .ca-logo p { font-size: 11px; color: #333; font-family: 'Fira Code',monospace; letter-spacing: 0.06em; }
        .ca-badge {
          display: flex; align-items: center; gap: 7px;
          background: rgba(0,229,255,0.07);
          border: 1px solid rgba(0,229,255,0.18);
          border-radius: 20px; padding: 6px 14px;
          font-size: 12px; color: #00e5ff; font-family: 'Fira Code',monospace;
        }
        .ca-dot {
          width: 7px; height: 7px; background: #00e5ff; border-radius: 50%;
          animation: caPulse 2s infinite;
        }
        @keyframes caPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }

        .ca-main {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 0;
        }
        .ca-panel { padding: 28px 36px; overflow-y: auto; }
        .ca-panel-l { border-right: 1px solid rgba(255,255,255,0.05); }

        .ca-panel-heading {
          font-size: 11px;
          font-family: 'Fira Code',monospace;
          color: #2e3250;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 18px;
          display: flex; align-items: center; gap: 8px;
        }
        .ca-panel-heading::before {
          content: ''; width: 3px; height: 13px;
          background: #00e5ff; border-radius: 2px; display: block;
        }

        .ca-tabs {
          display: flex; gap: 3px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 9px; padding: 3px; margin-bottom: 18px;
          width: fit-content;
        }
        .ca-tab {
          padding: 7px 18px; border-radius: 7px; border: none;
          background: transparent; color: #333;
          font-family: 'Syne',sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.18s; letter-spacing: 0.01em;
        }
        .ca-tab.active {
          background: rgba(0,229,255,0.1);
          color: #00e5ff;
          border: 1px solid rgba(0,229,255,0.18);
        }

        .ca-editor {
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 11px; overflow: hidden;
          background: #0c0e17;
        }
        .ca-editor-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 13px;
          background: rgba(255,255,255,0.025);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .ca-wm { display: flex; gap: 6px; }
        .ca-wm span { width: 10px; height: 10px; border-radius: 50%; }
        .ca-fname { font-family:'Fira Code',monospace; font-size:11px; color:#2a2e45; }
        .ca-lcount { font-family:'Fira Code',monospace; font-size:11px; color:#252840; }
        .ca-editor-body { display: flex; height: 340px; }
        .ca-gutter {
          min-width: 42px; padding: 13px 10px 13px 0;
          text-align: right; background: rgba(0,0,0,0.18);
          border-right: 1px solid rgba(255,255,255,0.04);
          font-family: 'Fira Code',monospace; font-size: 12.5px;
          line-height: 1.65; color: #1e2133;
          user-select: none; overflow: hidden;
        }
        .ca-gutter span { display: block; padding-right: 10px; }
        .ca-code {
          flex: 1; background: transparent; border: none; outline: none;
          color: #8a98b8; font-family: 'Fira Code',monospace;
          font-size: 13px; line-height: 1.65; padding: 13px 15px;
          resize: none; width: 100%; tab-size: 2;
        }
        .ca-code::placeholder { color: #1e2133; }

        .ca-drop {
          border: 1.5px dashed rgba(0,229,255,0.18);
          border-radius: 11px; height: 340px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 14px; cursor: pointer; transition: all 0.2s;
          background: rgba(0,229,255,0.015);
        }
        .ca-drop.over, .ca-drop:hover {
          border-color: rgba(0,229,255,0.45);
          background: rgba(0,229,255,0.04);
        }
        .ca-drop-icon {
          width: 58px; height: 58px;
          background: rgba(0,229,255,0.07);
          border: 1px solid rgba(0,229,255,0.14);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; transition: transform 0.2s;
        }
        .ca-drop:hover .ca-drop-icon { transform: scale(1.06); }
        .ca-drop-title { font-size: 15px; font-weight: 700; color: #6a7a9a; }
        .ca-drop-sub { font-size: 12px; color: #252840; font-family:'Fira Code',monospace; }

        .ca-review-btn {
          width: 100%; margin-top: 14px; padding: 13px;
          border: none; border-radius: 9px; cursor: pointer;
          font-family: 'Syne',sans-serif; font-size: 15px; font-weight: 800;
          letter-spacing: 0.4px; transition: all 0.2s; position: relative; overflow: hidden;
          background: linear-gradient(135deg, #00e5ff 0%, #006aff 100%);
          color: #000; box-shadow: 0 4px 24px rgba(0,229,255,0.2);
        }
        .ca-review-btn:hover:not(:disabled) { box-shadow: 0 4px 32px rgba(0,229,255,0.35); transform: translateY(-1px); }
        .ca-review-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }

        .ca-loader {
          height: 2px; margin-top: 11px; border-radius: 2px; overflow: hidden;
          background: rgba(255,255,255,0.05);
        }
        .ca-loader-bar {
          height: 100%; width: 40%;
          background: linear-gradient(90deg, transparent, #00e5ff, transparent);
          animation: caSlide 1.4s linear infinite;
        }
        @keyframes caSlide { 0%{transform:translateX(-250%)} 100%{transform:translateX(400%)} }

        .ca-error {
          margin-top: 10px; padding: 9px 13px;
          background: rgba(255,51,102,0.08);
          border: 1px solid rgba(255,51,102,0.18);
          border-radius: 8px; color: #ff3366;
          font-size: 12.5px; font-family:'Fira Code',monospace;
        }

        .ca-empty {
          height: 100%; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 14px; opacity: 0.25;
        }
        .ca-empty-glyph { font-size: 52px; opacity: .5; }
        .ca-empty-label { font-size: 13px; color: #333; font-family:'Fira Code',monospace; text-align: center; line-height: 1.6; }

        .ca-result { animation: caFadeIn 0.4s ease; }
        @keyframes caFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }

        .ca-result-top {
          display: flex; align-items: center; gap: 24px; margin-bottom: 24px;
        }
        .ca-result-meta { flex: 1; min-width: 0; }
        .ca-lang-tag {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(0,229,255,0.07);
          border: 1px solid rgba(0,229,255,0.14);
          color: #00c0d8; border-radius: 6px;
          padding: 3px 10px; font-size: 11px;
          font-family:'Fira Code',monospace; margin-bottom: 10px;
        }
        .ca-quality { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 7px; }
        .ca-summary { font-size: 12.5px; color: #3a4060; font-family:'Fira Code',monospace; line-height: 1.65; }

        .ca-stat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 22px; }
        .ca-stat {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.055);
          border-radius: 9px; padding: 13px 15px;
        }
        .ca-stat-label { font-size: 10px; color: #2a2e45; font-family:'Fira Code',monospace; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px; }
        .ca-stat-val { font-size: 22px; font-weight: 800; }

        .ca-sec-label {
          font-size: 10px; color: #252840; text-transform: uppercase;
          letter-spacing: 0.13em; font-family:'Fira Code',monospace;
          margin-bottom: 9px; padding-bottom: 7px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .ca-strengths { display: flex; flex-direction: column; gap: 5px; margin-bottom: 22px; }
        .ca-strength {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 12.5px; color: #3a4060;
          font-family:'Fira Code',monospace; line-height: 1.55;
        }
        .ca-strength-dot {
          width: 6px; height: 6px; min-width: 6px;
          background: #00d68f; border-radius: 50%; margin-top: 5px;
        }

        .ca-issues { display: flex; flex-direction: column; gap: 9px; margin-bottom: 20px; }
        .ca-all-good {
          text-align: center; padding: 22px;
          color: #00d68f; font-size: 14px; font-family:'Fira Code',monospace;
        }

        .ca-suggestions { display: flex; flex-direction: column; gap: 6px; }
        .ca-sug {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 12px; color: #2e3450; font-family:'Fira Code',monospace; line-height: 1.55;
        }
        .ca-sug-dot { width: 5px; height: 5px; min-width: 5px; background: #00e5ff; border-radius: 50%; margin-top: 5px; opacity: 0.5; }

        @media (max-width: 860px) {
          .ca-main { grid-template-columns: 1fr; }
          .ca-panel-l { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .ca-panel { padding: 22px 20px; }
          .ca-header { padding: 18px 20px; }
          .ca-result-top { flex-direction: column; align-items: flex-start; gap: 16px; }
        }
      `}</style>

      <div className="ca-root">
        {/* HEADER */}
        <header className="ca-header">
          <div className="ca-logo">
            <div className="ca-logo-icon">⚡</div>
            <div>
              <h1>checkmycode.ai</h1>
              {/* <p>// powered by claude</p> */}
            </div>
          </div>
          <div className="ca-badge">
            <div className="ca-dot" />
            AI Active
          </div>
        </header>

        {/* MAIN */}
        <div className="ca-main">
          {/* ── LEFT: INPUT ── */}
          <div className="ca-panel ca-panel-l">
            <p className="ca-panel-heading">Input</p>

            <div className="ca-tabs">
              <button
                className={`ca-tab ${tab === "write" ? "active" : ""}`}
                onClick={() => setTab("write")}
              >
                ✎ Write
              </button>
              <button
                className={`ca-tab ${tab === "upload" ? "active" : ""}`}
                onClick={() => setTab("upload")}
              >
                ↑ Upload
              </button>
            </div>

            {tab === "write" ? (
              <div className="ca-editor">
                <div className="ca-editor-bar">
                  <div className="ca-wm">
                    <span style={{ background: "#ff5f57" }} />
                    <span style={{ background: "#ffbd2e" }} />
                    <span style={{ background: "#28c840" }} />
                  </div>
                  <span className="ca-fname">{fileName || "untitled.js"}</span>
                  <span className="ca-lcount">{lines.length} lines</span>
                </div>
                <div className="ca-editor-body">
                  <div className="ca-gutter">
                    {Array.from(
                      { length: Math.max(lines.length, 14) },
                      (_, i) => (
                        <span key={i}>{i + 1}</span>
                      ),
                    )}
                  </div>
                  <textarea
                    className="ca-code"
                    placeholder="// Paste your code here…"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                  />
                </div>
              </div>
            ) : (
              <div
                className={`ca-drop ${dragOver ? "over" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className="ca-drop-icon">📁</div>
                <div className="ca-drop-title">Drop your file here</div>
                <div className="ca-drop-sub">or click to browse</div>
                <div
                  className="ca-drop-sub"
                  style={{ fontSize: 11, color: "#1a1e30" }}
                >
                  .js .ts .py .go .rs .java .cpp .cs + more
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => loadFile(e.target.files[0])}
                  accept=".js,.ts,.jsx,.tsx,.py,.go,.rs,.java,.cpp,.c,.cs,.php,.rb,.swift,.kt,.vue,.html,.css,.json,.yaml,.yml,.sh,.sql"
                />
              </div>
            )}

            <button
              className="ca-review-btn"
              onClick={reviewCode}
              disabled={loading}
            >
              {loading ? "⟳  Analyzing…" : "⚡  Review Code"}
            </button>

            {loading && (
              <div className="ca-loader">
                <div className="ca-loader-bar" />
              </div>
            )}
            {error && <div className="ca-error">⚠ {error}</div>}
          </div>

          {/* ── RIGHT: RESULTS ── */}
          <div className="ca-panel">
            <p className="ca-panel-heading">Analysis</p>

            {!result ? (
              <div className="ca-empty">
                <div className="ca-empty-glyph">◈</div>
                <div className="ca-empty-label">
                  Paste code and click
                  <br />
                  Review Code to begin
                </div>
              </div>
            ) : (
              <div className="ca-result">
                {/* Top: score + meta */}
                <div className="ca-result-top">
                  <ScoreRing score={result.score || 0} />
                  <div className="ca-result-meta">
                    <div className="ca-lang-tag">
                      ◆ {result.language || "Unknown"}
                    </div>
                    <div className="ca-quality">
                      {result.quality || "Unknown"}
                    </div>
                    <div className="ca-summary">{result.summary}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="ca-stat-row">
                  <div className="ca-stat">
                    <div className="ca-stat-label">Issues Found</div>
                    <div
                      className="ca-stat-val"
                      style={{
                        color:
                          (result.issues?.length || 0) > 0
                            ? "#ff6b35"
                            : "#00d68f",
                      }}
                    >
                      {result.issues?.length || 0}
                    </div>
                  </div>
                  <div className="ca-stat">
                    <div className="ca-stat-label">Strengths</div>
                    <div className="ca-stat-val" style={{ color: "#00e5ff" }}>
                      {result.strengths?.length || 0}
                    </div>
                  </div>
                </div>

                {/* Strengths */}
                {result.strengths?.length > 0 && (
                  <>
                    <div className="ca-sec-label">✓ Strengths</div>
                    <div className="ca-strengths">
                      {result.strengths.map((s, i) => (
                        <div key={i} className="ca-strength">
                          <div className="ca-strength-dot" />
                          {s}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Issues */}
                <div className="ca-sec-label">⚠ Issues</div>
                {!result.issues || result.issues.length === 0 ? (
                  <div className="ca-all-good">
                    ✓ No issues found — clean code!
                  </div>
                ) : (
                  <div className="ca-issues">
                    {result.issues.map((issue, idx) => (
                      <IssueCard
                        key={idx}
                        issue={issue}
                        idx={idx}
                        open={openIssue === idx}
                        onToggle={(i) =>
                          setOpenIssue(openIssue === i ? null : i)
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {result.suggestions?.length > 0 && (
                  <>
                    <div className="ca-sec-label">→ Suggestions</div>
                    <div className="ca-suggestions">
                      {result.suggestions.map((s, i) => (
                        <div key={i} className="ca-sug">
                          <div className="ca-sug-dot" />
                          {s}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
