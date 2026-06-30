import { z } from "zod";

export const signalDomains = [
  "shift",
  "participant",
  "incident",
  "property",
  "medication",
  "restrictive_practice",
  "complaint",
  "document",
  "compliance",
  "system",
] as const;

export const signalSeverities = [
  "info",
  "notice",
  "warning",
  "critical",
] as const;
export const actorTypes = [
  "provider",
  "staff",
  "participant",
  "guardian",
  "system",
  "contractor",
  "external",
] as const;
export const evidenceKinds = [
  "photo",
  "document",
  "audio",
  "video",
  "form",
  "case_note",
  "system_log",
] as const;
export const retentionClasses = [
  "standard",
  "incident",
  "reportable_incident",
  "financial",
  "clinical",
  "legal_hold",
] as const;

export const visibilityValues = [
  "provider",
  "participant",
  "guardian",
  "restricted",
] as const;

export const eventTypes = [
  "shift.started",
  "shift.ended",
  "shift.missed",
  "shift.late",
  "shift.worker_changed",
  "participant.unseen",
  "participant.welfare_check_requested",
  "participant.welfare_check_completed",
  "participant.goal_progress_logged",
  "participant.refusal_logged",
  "incident.created",
  "incident.triaged",
  "incident.escalated",
  "incident.resolved",
  "incident.reportable_flagged",
  "incident.ndis_commission_notified",
  "property.hazard_detected",
  "property.maintenance_requested",
  "property.maintenance_completed",
  "property.inspection_failed",
  "property.inspection_passed",
  "medication.prompted",
  "medication.refused",
  "medication.error_reported",
  "restrictive_practice.observed",
  "restrictive_practice.authorisation_checked",
  "restrictive_practice.escalated",
  "complaint.received",
  "complaint.acknowledged",
  "complaint.resolved",
  "document.uploaded",
  "document.parsed",
  "document.verified",
  "document.rejected",
  "compliance.review_opened",
  "compliance.review_closed",
  "compliance.evidence_pack_generated",
] as const;

export const SignalVisibilitySchema = z.enum(visibilityValues);
export const SignalDomainSchema = z.enum(signalDomains);
export const SignalSeveritySchema = z.enum(signalSeverities);
export const SignalRetentionClassSchema = z.enum(retentionClasses);
export const SignalEvidenceKindSchema = z.enum(evidenceKinds);
export const SignalActorTypeSchema = z.enum(actorTypes);

export const SignalActorSchema = z.object({
  actor_id: z.string().min(1).optional().nullable(),
  actor_type: SignalActorTypeSchema,
  actor_display_name: z.string().min(1).optional().nullable(),
  actor_role: z.string().min(1).optional().nullable(),
});

export const SignalEvidenceRefSchema = z.object({
  id: z.string().min(1).optional(),
  kind: SignalEvidenceKindSchema,
  filename: z.string().min(1).optional().nullable(),
  content_type: z.string().min(1).optional().nullable(),
  size_bytes: z.number().int().nonnegative().optional().nullable(),
  storage_uri: z.string().min(1).optional().nullable(),
  sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/i)
    .optional()
    .nullable(),
  verification_status: z
    .enum(["pending", "verified", "failed", "missing"])
    .optional()
    .nullable(),
});

const isoDateTime = z.string().datetime({ offset: true });

export const SignalEnvelopeSchema = z.object({
  tenant_id: z.string().min(1),
  domain: SignalDomainSchema,
  type: z.enum(eventTypes),
  severity: SignalSeveritySchema,
  actor: SignalActorSchema,
  subject_id: z.string().min(1).optional().nullable(),
  participant_id: z.string().min(1).optional().nullable(),
  property_id: z.string().min(1).optional().nullable(),
  shift_id: z.string().min(1).optional().nullable(),
  incident_id: z.string().min(1).optional().nullable(),
  occurred_at: isoDateTime,
  observed_at: isoDateTime.optional().nullable(),
  correlation_id: z.string().min(1).optional().nullable(),
  causation_id: z.string().min(1).optional().nullable(),
  visibility: SignalVisibilitySchema.default("provider"),
  retention_class: SignalRetentionClassSchema.default("standard"),
  schema_version: z.number().int().positive().default(1),
  payload: z.record(z.unknown()).default({}),
  evidence: z.array(SignalEvidenceRefSchema).default([]),
});

export const SignalCreateInputSchema = z.object({
  envelope: SignalEnvelopeSchema,
});

export type SignalEnvelope = z.infer<typeof SignalEnvelopeSchema>;
export type SignalCreateInput = z.infer<typeof SignalCreateInputSchema>;
export type SignalActor = z.infer<typeof SignalActorSchema>;
export type SignalEvidenceRef = z.infer<typeof SignalEvidenceRefSchema>;
export type SignalVisibility = z.infer<typeof SignalVisibilitySchema>;
export type SignalDomain = z.infer<typeof SignalDomainSchema>;
export type SignalSeverity = z.infer<typeof SignalSeveritySchema>;
export type SignalRetentionClass = z.infer<typeof SignalRetentionClassSchema>;
