import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { es } from "@/i18n/es";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { useSaveClinic } from "./queries";
import { clinicFormSchema, type ClinicFormValues } from "./schemas";
import type { Tables } from "@/lib/database.types";

export function ClinicFormDialog({
  clinic,
  isOpen,
  onOpenChange,
}: {
  clinic?: Tables<"clinics">;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const saveClinic = useSaveClinic();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, register, handleSubmit, formState } = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: {
      name: clinic?.name ?? "",
      address: clinic?.address ?? "",
      maps_url: clinic?.maps_url ?? "",
      phone: clinic?.phone ?? "",
      whatsapp: clinic?.whatsapp ?? "",
      is_active: clinic?.is_active ?? true,
    },
  });

  async function onSubmit(values: ClinicFormValues) {
    setFormError(null);
    try {
      await saveClinic.mutateAsync({
        id: clinic?.id,
        name: values.name,
        address: values.address || null,
        maps_url: values.maps_url || null,
        phone: values.phone || null,
        whatsapp: values.whatsapp || null,
        is_active: values.is_active,
      });
      onOpenChange(false);
      showToast({ title: es.admin.clinicas.guardadoOk, tone: "success" });
    } catch {
      setFormError(es.common.errorAccionGenerico);
    }
  }

  return (
    <Dialog
      title={clinic ? es.admin.clinicas.editar : es.admin.clinicas.agregar}
      isOpen={isOpen}
      isDismissable
      onOpenChange={onOpenChange}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field
          label={es.admin.clinicas.nombreLabel}
          isRequired
          isInvalid={!!formState.errors.name}
          errorMessage={formState.errors.name?.message}
          inputProps={register("name")}
        />
        <Field label={es.admin.clinicas.direccionLabel} inputProps={register("address")} />
        <Field
          label={es.admin.clinicas.mapsLabel}
          isInvalid={!!formState.errors.maps_url}
          errorMessage={formState.errors.maps_url?.message}
          inputProps={{ type: "url", ...register("maps_url") }}
        />
        <Field label={es.admin.clinicas.telefonoLabel} inputProps={{ type: "tel", ...register("phone") }} />
        <Field label={es.admin.clinicas.whatsappLabel} inputProps={{ type: "tel", ...register("whatsapp") }} />
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <Checkbox isSelected={field.value} onChange={field.onChange}>
              {es.admin.clinicas.activaLabel}
            </Checkbox>
          )}
        />
        {formError ? (
          <p className="text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="quiet" onPress={() => onOpenChange(false)}>
            {es.common.cancelar}
          </Button>
          <Button type="submit" variant="primary" isPending={formState.isSubmitting}>
            <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
            {es.common.guardar}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
