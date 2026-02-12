import type { ActivityLogEntry } from "@/modules/proposals/application/ports/activity-log-repository.port";

export interface RevisionCycleSnapshot {
  scopeDescription: string;
  dueDate: string | null;
  estimatedValueBrl: number | null;
}

export interface PendingRevisionCycle {
  cycleId: string;
  openedAt: Date;
  snapshot: RevisionCycleSnapshot;
}

function readSnapshot(
  metadata: Record<string, unknown>,
): RevisionCycleSnapshot | null {
  const rawSnapshot = metadata.before;
  if (!rawSnapshot || typeof rawSnapshot !== "object") {
    return null;
  }

  const scopeDescription =
    typeof (rawSnapshot as Record<string, unknown>).scopeDescription === "string"
      ? ((rawSnapshot as Record<string, unknown>).scopeDescription as string)
      : null;
  const dueDateValue = (rawSnapshot as Record<string, unknown>).dueDate;
  const estimatedValue = (rawSnapshot as Record<string, unknown>).estimatedValueBrl;

  if (scopeDescription === null) {
    return null;
  }

  return {
    scopeDescription,
    dueDate: typeof dueDateValue === "string" ? dueDateValue : null,
    estimatedValueBrl:
      typeof estimatedValue === "number" ? estimatedValue : null,
  };
}

export function findPendingRevisionCycle(
  events: ActivityLogEntry[],
): PendingRevisionCycle | null {
  const closedCycleIds = new Set<string>();

  for (const event of events) {
    if (
      event.action === "revision_cycle_closed" ||
      event.action === "revision_cycle_canceled"
    ) {
      const cycleId = event.metadata.cycleId;
      if (typeof cycleId === "string") {
        closedCycleIds.add(cycleId);
      }
    }
  }

  const opened = events.find((event) => {
    if (event.action !== "revision_cycle_opened") {
      return false;
    }

    const cycleId = event.metadata.cycleId;
    return typeof cycleId === "string" && !closedCycleIds.has(cycleId);
  });

  if (!opened) {
    return null;
  }

  const cycleId = opened.metadata.cycleId;
  const snapshot = readSnapshot(opened.metadata);
  if (typeof cycleId !== "string" || !snapshot) {
    return null;
  }

  return {
    cycleId,
    openedAt: opened.createdAt,
    snapshot,
  };
}
