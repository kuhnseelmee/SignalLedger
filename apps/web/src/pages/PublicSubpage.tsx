import { Link } from "react-router-dom";
import Seo from "./Seo";

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

type PublicSubpageProps = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export default function PublicSubpage({
  metaTitle,
  metaDescription,
  eyebrow,
  title,
  description,
  points,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: PublicSubpageProps) {
  const primaryIsExternal = primaryHref.startsWith("mailto:");
  return (
    <main className="landing-page">
      <Seo title={metaTitle} description={metaDescription} />
      <div className="landing-container">
        <header className="landing-header">
          <Link className="landing-brand" to="/" aria-label="SignalLedger home">
            <Wordmark />
          </Link>
          <div className="landing-nav" aria-label="Public">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/security">Security</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="landing-actions">
            {primaryIsExternal ? (
              <a className="button ghost" href={primaryHref}>
                {primaryLabel}
              </a>
            ) : (
              <Link className="button ghost" to={primaryHref}>
                {primaryLabel}
              </Link>
            )}
            <Link className="button" to={secondaryHref}>
              {secondaryLabel}
            </Link>
          </div>
        </header>

        <section className="content-section" aria-labelledby="public-title">
          <div className="section-heading">
            <p className="section-eyebrow">{eyebrow}</p>
            <h1 id="public-title">{title}</h1>
            <p>{description}</p>
          </div>
          <ul className="check-list">
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
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
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/security">Security</Link>
            <Link to="/contact">Contact</Link>
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
