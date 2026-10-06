import { useState } from "react";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { useClaimableGuestPatients, useClaimPatients } from "./queries";

/**
 * Pacientes creados por staff (invitados, sin cuenta) cuyo contact_email
 * coincide con el correo del tutor que acaba de iniciar sesión. Requiere
 * confirmación explícita — nunca se reasignan solos (ver claim_patients).
 */
export function ClaimGuestPatientsBanner() {
  const claimableQuery = useClaimableGuestPatients();
  const claimPatients = useClaimPatients();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);
  const [announce, setAnnounce] = useState("");

  const candidates = claimableQuery.data ?? [];
  if (dismissed || candidates.length === 0) return null;

  const allSelected = candidates.every((p) => selected.has(p.id)) && candidates.length > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onConfirm() {
    const ids = candidates.filter((p) => selected.has(p.id) || allSelected).map((p) => p.id);
    await claimPatients.mutateAsync(ids.length > 0 ? ids : candidates.map((p) => p.id));
    setAnnounce(es.familia.reclamarOk);
  }

  return (
    <GlassSurface className="flex flex-col gap-3 p-4">
      <h2 className="font-semibold text-ink">{es.familia.reclamarTitulo}</h2>
      <p className="text-sm text-muted">{es.familia.reclamarDescripcion}</p>
      <ul className="flex flex-col gap-2">
        {candidates.map((p) => (
          <li key={p.id}>
            <Checkbox isSelected={selected.has(p.id) || allSelected} onChange={() => toggle(p.id)}>
              {p.full_name}
            </Checkbox>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button variant="primary" onPress={onConfirm} isPending={claimPatients.isPending}>
          {es.familia.reclamarConfirmar}
        </Button>
        <Button variant="quiet" onPress={() => setDismissed(true)}>
          {es.familia.reclamarOmitir}
        </Button>
      </div>
      <LiveRegion message={announce} />
    </GlassSurface>
  );
}
