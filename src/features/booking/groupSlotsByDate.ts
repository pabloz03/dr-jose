import { formatClinicDateTime } from "@/lib/tz";
import type { SlotRow } from "./queries";

/**
 * Agrupa slots (UTC) por fecha LOCAL de la clínica, no por fecha UTC —
 * un slot a las 05:00 UTC es 23:00 del día anterior en America/Guatemala
 * (UTC-6). Agrupar por fecha UTC asignaría el slot al día equivocado.
 */
export function groupSlotsByDate(slots: SlotRow[]): Map<string, SlotRow[]> {
  const map = new Map<string, SlotRow[]>();
  for (const slot of slots) {
    const key = formatClinicDateTime(slot.slot_start, "yyyy-MM-dd");
    const list = map.get(key) ?? [];
    list.push(slot);
    map.set(key, list);
  }
  return map;
}
