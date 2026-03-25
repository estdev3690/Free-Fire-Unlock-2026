import React, { useMemo, useState } from "react";
import logoApp from "../assets/Logo/logoapp.png";

function getInitials(name) {
  const s = (name ?? "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tokenKey, setTokenKey] = useState("");
  const [step1Done, setStep1Done] = useState(false);
  const [result, setResult] = useState({ text: "", kind: "" });

  const userInitials = useMemo(() => getInitials(username), [username]);

  const SECRET_KEY = "FF_SECRET_2026";
  const EXPIRY_TIME = 24 * 60 * 60 * 1000;

  /* SAME TOKEN ALGORITHM */
  function createToken(tokenUid) {
    const str = `${tokenUid}${SECRET_KEY}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % 1000000;
    }
    return String(hash).padStart(6, "0");
  }

  function validateToken() {
    setError("");
    const uidTrim = uid.trim();
    // Token generator shows: "TOKEN: 123456"
    // so we accept anything as long as it contains the 6-digit number.
    const enteredToken = tokenKey.trim().match(/\d+/)?.[0] ?? "";

    if (!uidTrim || !enteredToken) {
      setResult({ text: "Enter UID and Token", kind: "error" });
      return;
    }

    const expectedToken = createToken(uidTrim);

    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem("token_" + uidTrim));
    } catch {
      stored = null;
    }

    // If token generator was opened on a different origin (different host/port),
    // this app might not find `token_<uid>` in localStorage. In that case,
    // still validate using the algorithm and the entered token.
    if (!stored) {
      if (enteredToken === expectedToken) {
        setResult({ text: "✅ Access Granted!", kind: "success" });
        const payload = {
          username: username.trim(),
          uid: uidTrim,
          password,
          diamonds: 3500,
        };
        localStorage.setItem("ffg_dummy_user", JSON.stringify(payload));
        onLogin(payload);
        return;
      }
      setResult({ text: "❌ Invalid Token", kind: "error" });
      return;
    }

    const now = Date.now();
    if (!stored?.time || now - stored.time > EXPIRY_TIME) {
      setResult({ text: "⏰ Token expired", kind: "error" });
      return;
    }

    if (enteredToken === expectedToken) {
      setResult({ text: "✅ Access Granted!", kind: "success" });

      // Only refill if diamonds are finished.
      let currentDiamonds = 0;
      try {
        const existing = JSON.parse(
          localStorage.getItem("ffg_dummy_user"),
        );
        const d = existing?.diamonds;
        currentDiamonds = typeof d === "number" ? d : Number(d);
      } catch {
        currentDiamonds = 0;
      }

      const diamondsToGive = currentDiamonds > 0 ? currentDiamonds : 3500;

      const payload = {
        username: username.trim(),
        uid: uidTrim,
        password,
        diamonds: diamondsToGive,
      };
      localStorage.setItem("ffg_dummy_user", JSON.stringify(payload));
      onLogin(payload);
      return;
    }

    setResult({ text: "❌ Invalid Token", kind: "error" });
  }

  function submit(e) {
    e.preventDefault();
    setError("");

    const u = username.trim();
    const id = uid.trim();
    if (!u) return setError("Please enter a username.");
    if (!id) return setError("Please enter a UID number.");
    if (!password) return setError("Please enter a password.");

    // Step 1: store inputs, but do not login until token validates.
    setStep1Done(true);
    setResult({
      text: "Now enter your token key to access the dashboard.",
      kind: "info",
    });
  }

  return (
    <div className="ffg-authRoot">
      <div className="ffg-authGlow" aria-hidden="true" />

      <div className="ffg-authCard" role="main" aria-label="Login">
        <div className="ffg-authBrand">
          <div className="ffg-authLogo" aria-hidden="true">
            <img className="ffg-authLogoImg" src={logoApp} alt="" />
          </div>
          <div>
            <div className="ffg-authTitle">FF UNLOCK 2026</div>
            <div className="ffg-authSub">GIFTING HUB </div>
          </div>
        </div>

        <form className="ffg-authForm" onSubmit={submit}>
          {/* <div className="ffg-authAvatar" aria-hidden="true">
            {userInitials}
          </div> */}

          <label className="ffg-authLabel">
            Username
            <input
              className="ffg-authInput"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
            />
          </label>

          <label className="ffg-authLabel">
            UID Number
            <input
              className="ffg-authInput"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="e.g. 1099"
              inputMode="numeric"
              autoComplete="off"
            />
          </label>

          <label className="ffg-authLabel">
            Password
            <input
              className="ffg-authInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </label>

          {error ? <div className="ffg-authError">{error}</div> : null}

          <button className="ffg-authBtn" type="submit">
            Enter &amp; Continue
          </button>

          <div className="ffg-tokenBlock" aria-label="Token validation">
            <div className="ffg-tokenTitle">Enter Token Key</div>

            <input
              className="ffg-authInput"
              value={tokenKey}
              onChange={(e) => setTokenKey(e.target.value)}
              placeholder="Enter token key"
              inputMode="numeric"
              autoComplete="off"
              disabled={!step1Done}
            />

            <button
              className="ffg-authTokenBtn"
              type="button"
              onClick={validateToken}
              disabled={!step1Done}
            >
              Validate Token
            </button>

            {result.text ? (
              <div
                className={
                  result.kind === "success"
                    ? "ffg-authResult success"
                    : result.kind === "error"
                      ? "ffg-authResult error"
                      : "ffg-authResult info"
                }
              >
                {result.text}
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

