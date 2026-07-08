import PublicSubpage from "./PublicSubpage";

export default function AboutPage() {
  return (
    <PublicSubpage
      metaTitle="About SignalLedger — Sovereign Event Ledger for NDIS Service Delivery"
      metaDescription="Learn how SignalLedger helps providers preserve a secure append-only record of service delivery events, evidence, and follow-up actions."
      eyebrow="About"
      title="SignalLedger is a sovereign event-driven reporting and evidence ledger for NDIS service delivery."
      description="It helps providers preserve a secure, append-only record of what happened, when it happened, who reported it, what evidence supports it, and what action followed."
      points={[
        "Supports governance without claiming official NDIS endorsement.",
        "Creates a tamper-evident operational timeline for care-related events.",
        "Designed for providers, compliance teams, and technology leads who need controlled visibility.",
        "Structured for evidence-backed signalling rather than a conventional dashboard-first product.",
      ]}
      primaryLabel="Request demo"
      primaryHref="/contact"
      secondaryLabel="Sign in"
      secondaryHref="/login"
    />
  );
}
