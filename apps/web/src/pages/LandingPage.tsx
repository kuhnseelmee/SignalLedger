import { Link } from "react-router-dom";
import Seo from "./Seo";

const navItems = [
  { label: "Platform", href: "#platform" },
  { label: "Evidence", href: "#evidence" },
  { label: "Governance", href: "#governance" },
  { label: "Security", href: "#security" },
  { label: "Contact", href: "#contact" },
] as const;

const problemPoints = [
  "Service delivery facts are scattered across notes, calls, forms, rosters, messages, and documents.",
  "Incident review often depends on fragmented evidence and after-the-fact recollection.",
  "Managers need to know what happened, when it was known, and what action followed.",
  "Providers need stronger internal visibility without surrendering control of their data.",
];

const solutionCards = [
  {
    mark: "01",
    title: "Append-only event history",
    body: "Capture service events in a timeline that preserves who reported what, when it was known, and how it moved through the organisation.",
  },
  {
    mark: "02",
    title: "Evidence-backed records",
    body: "Link signals to evidence references, hashes, and verification state so review can trace the operational record back to source material.",
  },
  {
    mark: "03",
    title: "Reliable signalling",
    body: "Use tenant-scoped publication, outbox delivery, and event-driven processing to keep workflows consistent when integrations or workers fall behind.",
  },
  {
    mark: "04",
    title: "Governance-ready workflows",
    body: "Support incident review, operational follow-up, and evidence pack preparation without turning the public surface into a dashboard gimmick.",
  },
];

const steps = [
  {
    title: "Capture the event",
    body: "Staff entry, incident reports, shift activity, property hazards, document verification, and system integrations can all originate a signal.",
  },
  {
    title: "Attach or reference evidence",
    body: "Store supporting material outside the event body and preserve SHA-256 hashes, verification status, and source pointers.",
  },
  {
    title: "Publish the signal",
    body: "Move the event through a reliable outbox so downstream systems receive a controlled, auditable publication.",
  },
  {
    title: "Review, act, and export",
    body: "Use the record of truth for review, follow-up, and evidence pack generation without rewriting history.",
  },
];

const integrityPoints = [
  "Append-only event records",
  "Per-tenant hash-chain integrity",
  "Evidence references with SHA-256 hashes",
  "Outbox-based reliable publication",
  "Audit-ready timelines",
  "Evidence pack generation",
];

const governanceDomains = [
  "Participant welfare",
  "Incidents and reportable incident review",
  "Shift delivery",
  "Property hazards",
  "Restrictive practice observations",
  "Complaints",
  "Documents",
  "Compliance reviews",
];

const sovereignStack = [
  "Runs on private infrastructure",
  "Local or VPS deployment",
  "Provider-controlled data",
  "No unnecessary external SaaS dependency",
  "PostgreSQL, NATS JetStream, MinIO or S3-compatible storage",
  "Designed for future integration with ACC, ShiftCare, LiteParse, n8n, email, and VoIP",
];

const previewCards = [
  {
    label: "Critical signals",
    value: "08",
    detail: "Tenant-scoped last 24 hours",
    tone: "warning",
  },
  {
    label: "Open workflow tasks",
    value: "14",
    detail: "Follow-up actions in progress",
    tone: "info",
  },
  {
    label: "Recent incidents",
    value: "03",
    detail: "Ready for review and escalation",
    tone: "neutral",
  },
  {
    label: "Evidence verification",
    value: "96%",
    detail: "Verified documents and packs",
    tone: "success",
  },
  {
    label: "Outbox health",
    value: "Healthy",
    detail: "Publication queue within threshold",
    tone: "success",
  },
  {
    label: "Chain verification",
    value: "Valid",
    detail: "Integrity checks passed",
    tone: "success",
  },
];

const audienceCards = [
  {
    title: "NDIS Providers",
    body: "Maintain a secure operational timeline that supports governance, evidence review, and service delivery visibility.",
  },
  {
    title: "Support Coordinators",
    body: "See the sequence of service events, evidence references, and follow-up actions without losing tenant boundaries.",
  },
  {
    title: "Compliance Officers",
    body: "Review incident handling, verification state, and audit trails from a tamper-evident record of truth.",
  },
  {
    title: "Property Managers",
    body: "Track hazards, maintenance signals, and property-related issues in the same governed workflow as care events.",
  },
  {
    title: "Operations Managers",
    body: "Understand what happened, what was known, and which tasks are still open across the provider network.",
  },
  {
    title: "Technology Leads",
    body: "Deploy a sovereign platform with predictable data boundaries, private infrastructure, and integration-ready events.",
  },
];

const securityPoints = [
  "Tenant isolation",
  "Role-based access",
  "Append-only audit trails",
  "Hash-chain verification",
  "Private infrastructure",
  "No sensitive data in event subjects",
  "Evidence references instead of embedded binaries",
];

function Wordmark() {
  return (
    <div className="wordmark" aria-label="SignalLedger">
      <span className="wordmark-mark" aria-hidden="true">
        <span />
        <span />
      </span>
      <span className="wordmark-text">SignalLedger</span>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="section-heading">
      <p className="section-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function LandingHeader() {
  return (
    <header className="landing-header">
      <Link className="landing-brand" to="/" aria-label="SignalLedger home">
        <Wordmark />
      </Link>
      <nav className="landing-nav" aria-label="Primary">
        {navItems.map((item) => (
          <a key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
        <Link className="text-link" to="/login">
          Login
        </Link>
      </nav>
      <div className="landing-actions">
        <Link className="button ghost" to="/contact">
          Request demo
        </Link>
        <Link className="button" to="/login">
          Sign in
        </Link>
      </div>
    </header>
  );
}

function HeroIllustration() {
  return (
    <div
      className="hero-visual"
      aria-label="SignalLedger event timeline illustration"
    >
      <div className="timeline-shell">
        <div className="timeline-head">
          <span className="pill">append-only</span>
          <span className="pill">tenant-scoped</span>
          <span className="pill">evidence-backed</span>
        </div>
        <div className="timeline-track" aria-hidden="true">
          <span className="timeline-line" />
          <span className="timeline-node node-one" />
          <span className="timeline-node node-two" />
          <span className="timeline-node node-three" />
        </div>
        <div className="timeline-grid">
          <article className="timeline-card raised">
            <span className="timeline-label">Signal</span>
            <strong>Incident reported</strong>
            <p>Hazard logged by staff with time, source, and tenant context.</p>
          </article>
          <article className="timeline-card">
            <span className="timeline-label">Evidence</span>
            <strong>SHA-256 hash</strong>
            <p>Stored object bytes verified against the reference record.</p>
          </article>
          <article className="timeline-card">
            <span className="timeline-label">Workflow</span>
            <strong>Follow-up open</strong>
            <p>
              Manager review and corrective action remain visible in the
              timeline.
            </p>
          </article>
        </div>
      </div>
      <div className="integrity-panel">
        <div className="integrity-meter" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <p className="microcopy">Integrity trail</p>
          <strong>Tamper-evident operational record</strong>
        </div>
        <div className="integrity-status">
          <span className="status-dot" />
          <span>Chain valid</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="landing-page">
      <Seo
        title="SignalLedger — Sovereign Event Ledger for NDIS Service Delivery"
        description="SignalLedger is a sovereign event-driven reporting and evidence ledger for NDIS providers, supporting append-only service delivery records, incident review, evidence trails, and governance workflows."
      />
      <div className="landing-container">
        <LandingHeader />

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="section-eyebrow">
              Sovereign event-driven reporting and evidence ledger
            </p>
            <h1 id="hero-title">
              A sovereign event ledger for NDIS service delivery.
            </h1>
            <p className="hero-description">
              SignalLedger records service events, incidents, evidence, and
              follow-up actions in a secure append-only timeline built for
              provider governance, audit readiness, and operational truth.
            </p>
            <div className="hero-actions">
              <Link className="button" to="/contact">
                Request a demo
              </Link>
              <a className="button secondary" href="#platform">
                View platform
              </a>
            </div>
            <dl className="hero-facts">
              <div>
                <dt>What it is</dt>
                <dd>Record of truth</dd>
              </div>
              <div>
                <dt>What it supports</dt>
                <dd>Governance and review</dd>
              </div>
              <div>
                <dt>How it deploys</dt>
                <dd>Sovereign infrastructure</dd>
              </div>
            </dl>
          </div>
          <HeroIllustration />
        </section>

        <section className="content-section" id="problem">
          <SectionHeading
            eyebrow="Why it matters"
            title="Operational truth is usually scattered."
            body="NDIS service delivery facts rarely live in one place. They are spread across notes, calls, forms, rosters, messages, and documents, which makes later review slower and less reliable."
          />
          <div className="problem-grid">
            {problemPoints.map((point) => (
              <article key={point} className="info-card">
                <p>{point}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="platform">
          <SectionHeading
            eyebrow="Platform"
            title="SignalLedger turns service events into governed signals."
            body="The platform preserves a secure, append-only record of what happened, when it happened, who reported it, what evidence supports it, and what action followed."
          />
          <div className="feature-grid">
            {solutionCards.map((card) => (
              <article key={card.title} className="feature-card">
                <span className="feature-mark" aria-hidden="true">
                  {card.mark}
                </span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" aria-labelledby="workflow-title">
          <SectionHeading
            eyebrow="How it works"
            title="A simple four-step signal flow."
            body="Events may originate from staff entry, incident reports, shift activity, property hazards, document verification, system integrations, or future external adapters."
          />
          <h3 id="workflow-title" className="sr-only">
            Workflow steps
          </h3>
          <ol className="step-grid">
            {steps.map((step, index) => (
              <li key={step.title} className="step-card">
                <span className="step-index">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="content-section two-column" id="evidence">
          <div>
            <SectionHeading
              eyebrow="Evidence and integrity"
              title="The record is evidence-backed and integrity-verifiable."
              body="SignalLedger does not hide the audit trail. It preserves append-only event records, per-tenant hash-chain integrity, and evidence references that can be reviewed later."
            />
            <ul className="check-list">
              {integrityPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <article className="callout-panel">
            <p className="microcopy">Integrity model</p>
            <h3>Tamper-evident by design, not by promise.</h3>
            <p>
              The system is built to make changes visible, preserve the
              publication trail, and keep evidence references auditable without
              rewriting history.
            </p>
            <div className="hash-chain" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </article>
        </section>

        <section className="content-section" id="governance">
          <SectionHeading
            eyebrow="NDIS governance"
            title="Supports governance across the domains that matter."
            body="SignalLedger is designed to support provider governance, incident review, participant welfare visibility, property risk tracking, document trails, and evidence pack preparation."
          />
          <div className="domain-grid">
            {governanceDomains.map((domain) => (
              <article key={domain} className="domain-card">
                <span className="domain-dot" aria-hidden="true" />
                <p>{domain}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section split" id="sovereign">
          <div>
            <SectionHeading
              eyebrow="Sovereign deployment"
              title="Keep the data boundary under provider control."
              body="SignalLedger is intended for private infrastructure where the organisation controls storage, access, and integration paths."
            />
            <ul className="check-list">
              {sovereignStack.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <article className="stack-card">
            <p className="microcopy">Platform stack</p>
            <div className="stack-tags">
              <span>PostgreSQL</span>
              <span>NATS JetStream</span>
              <span>MinIO / S3</span>
              <span>Private network</span>
              <span>Tenant boundary</span>
            </div>
            <p>
              Designed to fit a provider-owned deployment model without an
              unnecessary external SaaS dependency.
            </p>
          </article>
        </section>

        <section className="content-section" id="dashboard">
          <SectionHeading
            eyebrow="Dashboard preview"
            title="A clean operational view, without exposing the public surface."
            body="This is a static preview of the kinds of signals and health indicators a private deployment can surface."
          />
          <div className="preview-grid">
            {previewCards.map((card) => (
              <article
                key={card.label}
                className={`preview-card tone-${card.tone}`}
              >
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <span>{card.detail}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section" id="audience">
          <SectionHeading
            eyebrow="Who it is for"
            title="Built for the people who carry operational responsibility."
            body="Different roles need different visibility, but they all need the same trustworthy record underneath."
          />
          <div className="audience-grid">
            {audienceCards.map((card) => (
              <article key={card.title} className="audience-card">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section two-column" id="security">
          <article className="security-panel">
            <SectionHeading
              eyebrow="Security"
              title="Security principles are part of the product shape."
              body="The public face should reflect the private boundary behind it."
            />
            <ul className="security-list">
              {securityPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
          <article className="callout-panel alt">
            <p className="microcopy">Operational posture</p>
            <h3>
              Append-only audit trails. Tenant isolation. Evidence references.
            </h3>
            <p>
              The system is designed to support governance while keeping
              sensitive content inside the private deployment boundary.
            </p>
          </article>
        </section>

        <section
          className="cta-section"
          id="contact"
          aria-labelledby="contact-title"
        >
          <div>
            <p className="section-eyebrow">Contact</p>
            <h2 id="contact-title">
              Build your record of truth before you need to defend it.
            </h2>
            <p>
              SignalLedger gives providers a sovereign foundation for service
              delivery events, evidence trails, incident review, and operational
              governance.
            </p>
          </div>
          <div className="cta-actions">
            <Link className="button" to="/contact">
              Request demo
            </Link>
            <Link className="button secondary" to="/login">
              Sign in
            </Link>
          </div>
          <p className="contact-note">
            Demo and access requests should be handled through your provider
            deployment contact or implementation lead. This public page does not
            collect sensitive information.
          </p>
        </section>

        <footer className="landing-footer">
          <div className="footer-brand">
            <Wordmark />
            <p>
              SignalLedger is a sovereign event reporting and evidence ledger
              for NDIS service delivery.
            </p>
          </div>
          <div className="footer-links">
            <Link to="/about">About</Link>
            <Link to="/security">Security</Link>
            <Link to="/contact">Contact</Link>
            {navItems.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
            <Link to="/login">Login</Link>
          </div>
          <p className="footer-meta">
            © 2026 SignalLedger. Sovereign event reporting and evidence ledger.
          </p>
        </footer>
      </div>
    </main>
  );
}
