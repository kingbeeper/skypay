import { prisma } from "./db";

export type AuditInput = {
  actorId: string;
  actorEmail: string;
  action: string;
  targetId?: string | null;
  targetLabel?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logAudit(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      action: input.action,
      targetId: input.targetId ?? null,
      targetLabel: input.targetLabel ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
