import { useCallback, useEffect, useState } from "react";
import { Chrome, Loader2, LogIn, UserRound } from "lucide-react";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const SESSION_KEY = "wepink_optional_auth";

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; name?: string };
};
type AuthSession = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  user?: AuthUser;
};

interface OptionalAccountProps {
  onAuthenticated: (user: AuthUser) => void;
}

async function authRequest(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as AuthSession & { msg?: string; message?: string; error_description?: string };
  if (!response.ok) {
    throw new Error(result.msg ?? result.message ?? result.error_description ?? "Não foi possível autenticar. Confira os dados e tente novamente.");
  }
  return result;
}

export function OptionalAccount({ onAuthenticated }: OptionalAccountProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const configured = Boolean(SUPABASE_URL && SUPABASE_KEY);

  const finishAuth = useCallback((session: AuthSession) => {
    if (!session.access_token || !session.user) return;
    const stored: AuthSession = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at ?? (session.expires_in ? Math.floor(Date.now() / 1000) + session.expires_in : undefined),
      user: session.user,
    };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
    onAuthenticated(session.user);
    setMessage("Acesso conectado. Seus dados de identificação foram preenchidos.");
    setError("");
    setExpanded(false);
  }, [onAuthenticated]);

  useEffect(() => {
    if (!configured) return;
    let active = true;
    const loadUser = async (token: string) => {
      try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const user = (await response.json()) as AuthUser;
        if (active) onAuthenticated(user);
      } catch {
        // A compra como visitante continua disponível mesmo se a sessão não puder ser restaurada.
      }
    };

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const oauthToken = hash.get("access_token");
    if (oauthToken) {
      void loadUser(oauthToken).then(() => {
        if (!active) return;
        const expiresIn = Number(hash.get("expires_in") ?? 3600);
        const refreshToken = hash.get("refresh_token") ?? undefined;
        void fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${oauthToken}` },
        }).then(async (response) => {
          if (!response.ok || !active) return;
          const user = (await response.json()) as AuthUser;
          if (!active) return;
          finishAuth({
            access_token: oauthToken,
            refresh_token: refreshToken,
            expires_at: Math.floor(Date.now() / 1000) + expiresIn,
            user,
          });
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }).catch(() => undefined);
      });
    } else {
      try {
        const stored = JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? "null") as AuthSession | null;
        if (stored?.access_token) void loadUser(stored.access_token);
      } catch {
        window.localStorage.removeItem(SESSION_KEY);
      }
    }
    return () => { active = false; };
  }, [configured, onAuthenticated, finishAuth]);

  const submit = async () => {
    setError("");
    setMessage("");
    if (!configured) {
      setError("O login ainda precisa ser conectado ao projeto Supabase da loja.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const session = mode === "signup"
        ? await authRequest("signup", { email: email.trim(), password, data: { full_name: fullName.trim() }, options: { emailRedirectTo: window.location.origin + "/checkout" } })
        : await authRequest("token?grant_type=password", { email: email.trim(), password });
      if (session.access_token && session.user) {
        finishAuth(session);
      } else {
        setMessage("Cadastro iniciado! Confira seu e-mail para confirmar a conta e depois volte ao checkout. Você também pode continuar sem cadastro.");
        setMode("login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const google = () => {
    if (!configured) {
      setError("O login com Google será ativado assim que o Supabase e o provedor Google forem configurados.");
      return;
    }
    const redirect = encodeURIComponent(window.location.origin + window.location.pathname + window.location.search);
    window.location.assign(`${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirect}`);
  };

  return (
    <section className="optional-account" aria-label="Cadastro opcional">
      <div className="optional-account-topline">
        <span className="optional-account-badge">BLACK FRIDAY WEPINK</span>
        <span className="optional-account-spark">✦</span>
      </div>
      <div className="optional-account-copy">
        <div className="optional-account-icon"><UserRound size={19} /></div>
        <div>
          <strong>Quer agilizar suas próximas compras?</strong>
          <p>Crie sua conta ou entre com Google. É opcional — você pode continuar como visitante.</p>
        </div>
      </div>
      <div className="optional-account-actions">
        <button className="optional-account-google" type="button" onClick={google} disabled={!configured || busy}>
          <Chrome size={17} /> continuar com Google
        </button>
        <button className="optional-account-email" type="button" onClick={() => { setExpanded((value) => !value); setError(""); setMessage(""); }}>
          <LogIn size={16} /> {expanded ? "fechar" : "entrar ou cadastrar"}
        </button>
      </div>
      {expanded && (
        <div className="optional-account-form">
          <div className="optional-account-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>entrar</button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>criar conta</button>
          </div>
          {mode === "signup" && (
            <label>nome completo
              <input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Seu nome" />
            </label>
          )}
          <label>e-mail
            <input autoComplete="email" inputMode="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" />
          </label>
          <label>senha
            <input autoComplete={mode === "signup" ? "new-password" : "current-password"} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" />
          </label>
          <button className="optional-account-submit" type="button" onClick={() => void submit()} disabled={busy || !configured}>
            {busy ? <Loader2 className="animate-spin" size={16} /> : null}
            {mode === "signup" ? "criar minha conta" : "entrar na minha conta"}
          </button>
          {!configured && <p className="optional-account-hint">Login aguardando conexão das credenciais Supabase da loja. A compra como visitante segue liberada.</p>}
        </div>
      )}
      {error && <p className="optional-account-error" role="alert">{error}</p>}
      {message && <p className="optional-account-success" role="status">{message}</p>}
      <p className="optional-account-guest">Prefere não criar conta? <strong>Continue normalmente abaixo.</strong></p>
    </section>
  );
}
