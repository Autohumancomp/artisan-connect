import { PRIORITE_LABELS, STATUT_LABELS, type Priorite, type StatutRelance } from "@/lib/fidel";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function StatutBadge({ statut }: { statut: StatutRelance }) {
  return (
    <span
      className={cn(
        base,
        statut === "a_relancer" && "border-destructive/30 bg-destructive/10 text-destructive",
        statut === "relance" && "border-success/30 bg-success/10 text-success",
        statut === "a_venir" && "border-border bg-secondary text-secondary-foreground",
      )}
    >
      {STATUT_LABELS[statut]}
    </span>
  );
}

export function PrioriteBadge({ priorite }: { priorite: Priorite | null }) {
  if (!priorite) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        base,
        priorite === "haute" && "border-destructive/30 bg-destructive/10 text-destructive",
        priorite === "moyenne" && "border-warning/40 bg-warning/15 text-warning-foreground",
        priorite === "basse" && "border-border bg-secondary text-secondary-foreground",
      )}
    >
      {PRIORITE_LABELS[priorite]}
    </span>
  );
}
