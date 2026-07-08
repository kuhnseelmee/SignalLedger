import PublicSubpage from "./PublicSubpage";

export default function ContactPage() {
  return (
    <PublicSubpage
      metaTitle="Contact SignalLedger — Request a Demo"
      metaDescription="Request a SignalLedger demo or implementation discussion through the public contact path or sign in if you already have access."
      eyebrow="Contact"
      title="Request access or a demo through your provider implementation path."
      description="This public page does not collect sensitive information. For a demo or implementation discussion, use the contact path below or sign in if you already have access."
      points={[
        "Request demo sends you to the provider contact path used for implementation and access review.",
        "Public pages remain free of operational data and do not expose tenant-specific information.",
        "Sign in remains available for existing authorised users.",
        "No backend form submission is introduced on the public landing surface.",
      ]}
      primaryLabel="Request demo"
      primaryHref="mailto:demo@signalledger.local?subject=SignalLedger%20demo%20request"
      secondaryLabel="Sign in"
      secondaryHref="/login"
    />
  );
}
