import PublicSubpage from "./PublicSubpage";

export default function SecurityPage() {
  return (
    <PublicSubpage
      metaTitle="Security — SignalLedger"
      metaDescription="SignalLedger supports tenant isolation, role-based access, hash-chain verification, and private infrastructure for NDIS provider deployments."
      eyebrow="Security"
      title="Security and tenant isolation are part of the public contract."
      description="SignalLedger is designed to support provider-controlled deployments with append-only records, explicit tenant boundaries, and evidence references instead of embedded binaries."
      points={[
        "Tenant isolation is enforced across service delivery records and evidence trails.",
        "Role-based access keeps operational visibility scoped to the authenticated context.",
        "Hash-chain verification makes the record integrity-verifiable rather than merely visible.",
        "Private infrastructure avoids unnecessary external SaaS dependency.",
      ]}
      primaryLabel="Request demo"
      primaryHref="/contact"
      secondaryLabel="Sign in"
      secondaryHref="/login"
    />
  );
}
