import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { api } from "./api";

type Session = {
  userId: string;
  email: string;
  displayName: string;
  tenantName: string;
  role: string;
} | null;

function useSession() {
  const [session, setSession] = useState<Session | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((me) => {
        if (!cancelled) setSession(me);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { session, setSession };
}

function AppShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: NonNullable<Session>;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Link to="/dashboard" className="wordmark">
            <span className="wordmark-mark" aria-hidden="true">
              SL
            </span>
            <span>
              <span className="brand">SignalLedger</span>
              <span className="subtle">Sovereign event ledger</span>
            </span>
          </Link>
          <div className="subtle sidebar-tenant">{session.tenantName}</div>
        </div>
        <nav className="nav" aria-label="Private navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/signals">Signals</Link>
          <Link to="/incidents">Incidents</Link>
          <Link to="/tasks">Tasks</Link>
          <Link to="/evidence">Evidence</Link>
          <Link to="/evidence-packs">Evidence Packs</Link>
        </nav>
        <div className="sidebar-footer">
          <span className="chip">User: {session.displayName}</span>
          <span className="chip">Role: {session.role}</span>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="public-header">
      <Link to="/" className="wordmark public-wordmark">
        <span className="wordmark-mark" aria-hidden="true">
          SL
        </span>
        <span>
          <span className="brand">SignalLedger</span>
          <span className="subtle">Sovereign event ledger</span>
        </span>
      </Link>
      <nav className="public-nav" aria-label="Public navigation">
        <Link to="/about">About</Link>
        <Link to="/security">Security</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/login">Login</Link>
      </nav>
    </header>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-page">
      <PublicHeader />
      <main>{children}</main>
    </div>
  );
}

function LandingPage() {
  return (
    <PublicLayout>
      <section className="public-hero">
        <div className="hero-copy">
          <div className="eyebrow">NDIS governance infrastructure</div>
          <h1>A sovereign event ledger for service delivery truth.</h1>
          <p className="lede">
            SignalLedger records service events, incidents, evidence, and
            follow-up actions in a tamper-evident timeline built for provider
            governance, audit readiness, and operational accountability.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/contact">
              Request a demo
            </Link>
            <Link className="button button-secondary" to="/security">
              View security model
            </Link>
          </div>
        </div>
        <div className="hero-panel" aria-label="Platform highlights">
          <div className="timeline-header">
            <span>Operational timeline</span>
            <span className="status-pill status-pill-good">Verified</span>
          </div>
          <div className="timeline-cards">
            <article className="signal-card signal-card-primary">
              <strong>Incident logged</strong>
              <span>Event captured with tenant, actor, and timestamp.</span>
            </article>
            <article className="signal-card">
              <strong>Evidence attached</strong>
              <span>Document hash and verification state recorded.</span>
            </article>
            <article className="signal-card">
              <strong>Action assigned</strong>
              <span>Workflow task opened for review and follow-up.</span>
            </article>
          </div>
        </div>
      </section>

      <section className="section public-grid" id="platform">
        <article className="card">
          <h2>Append-only records</h2>
          <p>
            Corrections are modelled as new events, preserving operational
            history rather than overwriting it.
          </p>
        </article>
        <article className="card">
          <h2>Evidence-backed timelines</h2>
          <p>
            Evidence references, hashes, and verification results sit beside the
            events they support.
          </p>
        </article>
        <article className="card">
          <h2>Tenant-scoped governance</h2>
          <p>
            Access, visibility, audit logs, and timelines are enforced by tenant
            and role at the API layer.
          </p>
        </article>
      </section>

      <section className="section section-split">
        <div>
          <div className="eyebrow">Why it exists</div>
          <h2>Fragmented records create weak accountability.</h2>
          <p>
            SignalLedger is designed for providers who need to know what
            happened, when it was known, what evidence existed, and what action
            followed.
          </p>
        </div>
        <div className="card checklist-card">
          <div className="check-row">✓ Hash-chain integrity</div>
          <div className="check-row">✓ Outbox-backed publication</div>
          <div className="check-row">✓ Evidence verification</div>
          <div className="check-row">✓ Audit logging</div>
          <div className="check-row">✓ Sovereign deployment</div>
        </div>
      </section>

      <section className="section public-cta" id="contact">
        <h2>Built for serious operational records.</h2>
        <p>
          Public pages explain the platform. Product routes remain protected
          behind the authenticated login flow.
        </p>
        <Link className="button button-primary" to="/login">
          Sign in to SignalLedger
        </Link>
      </section>
    </PublicLayout>
  );
}

function AboutPage() {
  return (
    <PublicLayout>
      <section className="public-document">
        <h1>About SignalLedger</h1>
        <p>
          SignalLedger is a sovereign, append-only reporting and signalling
          platform for NDIS provider operations.
        </p>
        <p>
          It is designed to preserve service delivery events, evidence links,
          workflow actions, and audit records in a durable operational timeline.
        </p>
      </section>
    </PublicLayout>
  );
}

function SecurityPage() {
  return (
    <PublicLayout>
      <section className="public-document">
        <h1>Security</h1>
        <p>
          SignalLedger is designed around tenant isolation, role-based access,
          append-only event records, hash-chain verification, and evidence
          integrity checks.
        </p>
        <p>
          Internal services such as Postgres, NATS, and MinIO should remain
          private. Public access should enter only through the web/API front
          door.
        </p>
      </section>
    </PublicLayout>
  );
}

function ContactPage() {
  return (
    <PublicLayout>
      <section className="public-document">
        <h1>Contact</h1>
        <p>
          For demonstration access, deployment discussion, or provider pilot
          enquiries, contact the SignalLedger operator.
        </p>
        <p className="subtle">
          This page is intentionally simple until a production contact workflow
          is connected.
        </p>
      </section>
    </PublicLayout>
  );
}

function PrivacyPage() {
  return (
    <PublicLayout>
      <section className="public-document">
        <h1>Privacy</h1>
        <p>
          SignalLedger is designed for provider-controlled deployment. Privacy
          obligations depend on the operator, deployment model, data entered,
          and applicable Australian privacy and NDIS requirements.
        </p>
        <p>
          Do not place real participant information into a demo or development
          environment.
        </p>
      </section>
    </PublicLayout>
  );
}

function TermsPage() {
  return (
    <PublicLayout>
      <section className="public-document">
        <h1>Terms</h1>
        <p>
          SignalLedger is early-stage governance infrastructure. The public
          front door explains the platform and does not represent a compliance
          guarantee.
        </p>
        <p>
          Operators remain responsible for lawful deployment, access control,
          data handling, and regulatory obligations.
        </p>
      </section>
    </PublicLayout>
  );
}

function LoginForm({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
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
      <label>
        Email
        <input
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Password
        <input
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button type="submit">Log in</button>
    </form>
  );
}

function LoginPage({
  session,
  setSession,
}: {
  session: Session | undefined;
  setSession: (session: Session) => void;
}) {
  const navigate = useNavigate();

  if (session === undefined) return <div className="auth-screen">Loading...</div>;
  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="auth-screen">
      <LoginForm
        onLogin={async (email, password) => {
          await api.login(email, password);
          const me = await api.me();
          setSession(me);
          navigate("/dashboard");
        }}
      />
    </div>
  );
}

function PrivateRoute({
  session,
  children,
}: {
  session: Session | undefined;
  children: React.ReactNode;
}) {
  if (session === undefined) return <div className="auth-screen">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <AppShell session={session}>{children}</AppShell>;
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

function Dashboard({ session }: { session: NonNullable<Session> }) {
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
          <span className="chip">User: {session.displayName}</span>
          <span className="chip">Role: {session.role}</span>
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

function SignalRoute() {
  const { id = "" } = useParams();
  return <SignalDetailPage id={id} />;
}

function App() {
  const { session, setSession } = useSession();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route
        path="/login"
        element={<LoginPage session={session} setSession={setSession} />}
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute session={session}>
            {session && <Dashboard session={session} />}
          </PrivateRoute>
        }
      />
      <Route
        path="/signals"
        element={
          <PrivateRoute session={session}>
            <SignalListPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/signals/:id"
        element={
          <PrivateRoute session={session}>
            <SignalRoute />
          </PrivateRoute>
        }
      />
      <Route
        path="/incidents"
        element={
          <PrivateRoute session={session}>
            <IncidentsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <PrivateRoute session={session}>
            <TasksPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/evidence"
        element={
          <PrivateRoute session={session}>
            <EvidencePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/evidence-packs"
        element={
          <PrivateRoute session={session}>
            <EvidencePacksPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
