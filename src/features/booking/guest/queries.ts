import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SlotRow } from "@/features/booking/queries";

export interface GuestClinic {
  id: string;
  name: string;
  address: string | null;
  maps_url: string | null;
  timezone: string;
}
export interface GuestDoctor {
  id: string;
  full_name: string;
}
export interface GuestType {
  id: string;
  name: string;
  duration_min: number;
}
export interface GuestSettings {
  min_cancel_hours: number;
  max_booking_days: number;
}
export interface GuestOptions {
  ok: boolean;
  /** Presente cuando hay más de una clínica activa y todavía no se eligió una — el resto de campos no vienen hasta elegir. */
  clinics?: GuestClinic[];
  clinic?: GuestClinic;
  doctor?: GuestDoctor;
  types?: GuestType[];
  settings?: GuestSettings;
  error?: string;
}

async function callGuestBooking<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>("guest-booking", { body });
  if (error) throw error;
  return data as T;
}

export function useGuestOptions(clinicId?: string) {
  return useQuery({
    queryKey: ["guest-booking-options", clinicId],
    queryFn: () => callGuestBooking<GuestOptions>({ mode: "options", clinic_id: clinicId }),
  });
}

export function useGuestSlots(params: {
  clinicId: string | undefined;
  doctorId: string | undefined;
  typeId: string | undefined;
  from: string;
  to: string;
}) {
  const { clinicId, doctorId, typeId, from, to } = params;
  return useQuery({
    queryKey: ["guest-booking-slots", clinicId, doctorId, typeId, from, to],
    enabled: !!clinicId && !!doctorId && !!typeId,
    queryFn: () =>
      callGuestBooking<{ ok: boolean; slots?: SlotRow[]; error?: string }>({
        mode: "slots",
        clinic_id: clinicId,
        doctor_id: doctorId,
        type_id: typeId,
        from,
        to,
      }),
  });
}

export class GuestBookingError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export function useGuestBook() {
  return useMutation({
    mutationFn: async (params: {
      fullName: string;
      contactEmail: string;
      typeId: string;
      clinicId: string;
      doctorId: string;
      start: string;
      website?: string;
    }) => {
      const result = await callGuestBooking<{ ok: boolean; appointment_id?: string; error?: string }>({
        mode: "book",
        full_name: params.fullName,
        contact_email: params.contactEmail,
        type_id: params.typeId,
        clinic_id: params.clinicId,
        doctor_id: params.doctorId,
        start: params.start,
        website: params.website,
      });
      if (!result.ok) throw new GuestBookingError(result.error ?? "error_generico");
      return result;
    },
  });
}
