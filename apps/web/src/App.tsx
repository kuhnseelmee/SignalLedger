import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./api";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import SecurityPage from "./pages/SecurityPage";

type Session = {
  userId: string;
  email: string;
  displayName: string;
  tenantName: string;
  role: string;
} | null;

function AppShell({
  children,
  session,
  onLogout,
  logoutLoading,
}: {
  children: React.ReactNode;
  session: Session;
  onLogout: () => Promise<void>;
  logoutLoading: boolean;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div className="brand">SignalLedger</div>
          <div className="subtle">{session?.tenantName ?? "Local tenant"}</div>
        </div>
        <nav className="nav">
          <a href="/dashboard">Dashboard</a>
          <a href="/signals">Signals</a>
          <a href="/incidents">Incidents</a>
          <a href="/tasks">Tasks</a>
          <a href="/evidence">Evidence</a>
          <a href="/evidence-packs">Evidence Packs</a>
        </nav>
        <button
          className="button secondary sidebar-logout"
          onClick={() => void onLogout()}
          disabled={logoutLoading}
        >
          {logoutLoading ? "Logging out..." : "Log out"}
        </button>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

function LoginPage({
  onLogin,
  error,
  loading,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  error: string | null;
  loading: boolean;
}) {
  return (
    <div className="auth-screen">
      <LoginForm onLogin={onLogin} error={error} loading={loading} />
    </div>
  );
}

function LoginForm({
  onLogin,
  error,
  loading,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  error: string | null;
  loading: boolean;
}) {
  const [email, setEmail] = useState("demo.admin@signalledger.local");
  const [password, setPassword] = useState("DemoPassword123!");
  return (
    <form
      className="card login"
      onSubmit={(event) => {
        event.preventDefault();
        void onLogin(email, password);
      }}
    >
      <h1>Sign in</h1>
      {error ? (
        <div className="alert error" role="alert">
          {error}
        </div>
      ) : null}
      <label>
        Email
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Log in"}
      </button>
    </form>
  );
}

function SignalTimeline({ signals }: { signals: any[] }) {
  return (
    <div className="stack">
      {signals.map((signal) => (
        <article key={signal.id} className="card">
          <div className="row">
            <strong>{signal.type}</strong>
            <span className={`badge ${signal.severity}`}>
              {signal.severity}
            </span>
          </div>
          <div className="meta">
            <span>{new Date(signal.occurred_at).toLocaleString()}</span>
            <span>{signal.domain}</span>
            <span>{signal.visibility}</span>
            <span>{signal.retention_class}</span>
          </div>
          <pre>{JSON.stringify(signal.payload, null, 2)}</pre>
        </article>
      ))}
    </div>
  );
}

function Dashboard({ session }: { session: Session }) {
  const [signals, setSignals] = useState<any[]>([]);
  useEffect(() => {
    api
      .signals()
      .then(setSignals)
      .catch(() => setSignals([]));
  }, []);
  return (
    <div className="stack">
      <section className="hero card">
        <h1>Dashboard</h1>
        <p>
          Append-only event timeline, workflow tasks, and evidence-backed
          reporting for NDIS operations.
        </p>
        <div className="chips">
          <span className="chip">User: {session?.displayName}</span>
          <span className="chip">Role: {session?.role}</span>
          <span className="chip">Signals: {signals.length}</span>
        </div>
      </section>
      <section className="card">
        <h2>Recent signals</h2>
        <SignalTimeline signals={signals.slice(0, 5)} />
      </section>
    </div>
  );
}

function SignalListPage() {
  const [signals, setSignals] = useState<any[]>([]);
  useEffect(() => {
    api
      .signals()
      .then(setSignals)
      .catch(() => setSignals([]));
  }, []);
  return (
    <section className="stack">
      <h1>Signals</h1>
      <SignalTimeline signals={signals} />
    </section>
  );
}

function SignalDetailPage({ id }: { id: string }) {
  const [signal, setSignal] = useState<any>(null);
  useEffect(() => {
    api
      .signal(id)
      .then(setSignal)
      .catch(() => setSignal(null));
  }, [id]);
  if (!signal) return <div className="card">Loading...</div>;
  return <pre className="card">{JSON.stringify(signal, null, 2)}</pre>;
}

function EvidencePacksPage() {
  const [result, setResult] = useState<string>("");
  return (
    <div className="stack">
      <h1>Evidence packs</h1>
      <button
        className="card"
        onClick={async () => {
          const response = await api.evidencePack({});
          setResult(JSON.stringify(response, null, 2));
        }}
      >
        Generate evidence pack stub
      </button>
      {result && <pre className="card">{result}</pre>}
    </div>
  );
}

function IncidentsPage() {
  const [signals, setSignals] = useState<any[]>([]);
  useEffect(() => {
    api
      .incidents()
      .then(setSignals)
      .catch(() => setSignals([]));
  }, []);
  return (
    <section className="stack">
      <h1>Incidents</h1>
      <SignalTimeline signals={signals} />
    </section>
  );
}

function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  useEffect(() => {
    api
      .tasks()
      .then(setTasks)
      .catch(() => setTasks([]));
  }, []);
  return (
    <section className="stack">
      <h1>Tasks</h1>
      {tasks.map((task) => (
        <article key={task.id} className="card">
          <strong>{task.title}</strong>
          <div className="meta">
            {task.priority} · {task.status} · {task.assigned_role}
          </div>
          {task.description && <p>{task.description}</p>}
        </article>
      ))}
    </section>
  );
}

function EvidencePage() {
  return (
    <div className="card">
      Evidence registration and verification are exposed through the API.
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    api
      .me()
      .then(setSession)
      .catch(() => setSession(null));
  }, []);
  if (!session) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={async (email, password) => {
                setLoginLoading(true);
                setLoginError(null);
                try {
                  await api.login(email, password);
                  const me = await api.me();
                  setSession(me);
                  navigate("/dashboard");
                } catch (error) {
                  setLoginError(
                    error instanceof Error ? error.message : "Login failed",
                  );
                } finally {
                  setLoginLoading(false);
                }
              }}
              error={loginError}
              loading={loginLoading}
            />
          }
        />
        <Route path="*" element={<Navigate to={location.pathname === "/login" ? "/login" : "/"} replace />} />
      </Routes>
    );
  }
  return (
    <AppShell
      session={session}
      logoutLoading={logoutLoading}
      onLogout={async () => {
        setLogoutLoading(true);
        try {
          await api.logout();
        } catch {
          // Fall through and clear local state even if the server call fails.
        } finally {
          setSession(null);
          setLoginError(null);
          setLogoutLoading(false);
          navigate("/login", { replace: true });
        }
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/about" element={<Navigate to="/dashboard" replace />} />
        <Route path="/contact" element={<Navigate to="/dashboard" replace />} />
        <Route path="/security" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard session={session} />} />
        <Route path="/signals" element={<SignalListPage />} />
        <Route path="/signals/:id" element={<SignalRoute />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/evidence" element={<EvidencePage />} />
        <Route path="/evidence-packs" element={<EvidencePacksPage />} />
      </Routes>
    </AppShell>
  );
}

function SignalRoute() {
  const { id = "" } = useParams();
  return <SignalDetailPage id={id} />;
}

export default App;
