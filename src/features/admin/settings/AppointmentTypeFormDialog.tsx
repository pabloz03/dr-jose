import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Check } from "lucide-react";
import { es } from "@/i18n/es";
import { Dialog } from "@/components/ui/Dialog";
import { ControlledField } from "@/components/ui/ControlledField";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { useSaveAppointmentType } from "./queries";
import { appointmentTypeFormSchema, type AppointmentTypeFormValues } from "./schemas";
import type { Tables } from "@/lib/database.types";

export function AppointmentTypeFormDialog({
  type,
  isOpen,
  onOpenChange,
}: {
  type?: Tables<"appointment_types">;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const saveType = useSaveAppointmentType();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, formState, reset } = useForm<
    z.input<typeof appointmentTypeFormSchema>,
    unknown,
    z.output<typeof appointmentTypeFormSchema>
  >({
    resolver: zodResolver(appointmentTypeFormSchema),
    defaultValues: { name: "", duration_min: 20, buffer_after_min: 0, is_active: true, bookable_online: true },
  });

  useEffect(() => {
    if (type) {
      reset({
        name: type.name,
        duration_min: type.duration_min,
        buffer_after_min: type.buffer_after_min,
        is_active: type.is_active,
        bookable_online: type.bookable_online,
      });
    }
  }, [type, reset]);

  async function onSubmit(values: AppointmentTypeFormValues) {
    setFormError(null);
    try {
      await saveType.mutateAsync({ id: type?.id, ...values, sort: type?.sort ?? 0 });
      onOpenChange(false);
      showToast({ title: es.admin.ajustes.tipoGuardadoOk, tone: "success" });
    } catch {
      setFormError(es.common.errorAccionGenerico);
    }
  }

  return (
    <Dialog
      title={type ? es.admin.ajustes.tipoEditar : es.admin.ajustes.tipoAgregar}
      isOpen={isOpen}
      isDismissable
      onOpenChange={onOpenChange}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <ControlledField control={control} name="name" label={es.admin.ajustes.tipoNombreLabel} isRequired />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ControlledField
            control={control}
            name="duration_min"
            label={es.admin.ajustes.tipoDuracionLabel}
            isRequired
            inputProps={{ type: "number", min: 5, step: 5 }}
          />
          <ControlledField
            control={control}
            name="buffer_after_min"
            label={es.admin.ajustes.tipoBufferLabel}
            inputProps={{ type: "number", min: 0, step: 5 }}
          />
        </div>
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <Switch isSelected={field.value} onChange={field.onChange}>
              {es.admin.ajustes.tipoActivoLabel}
            </Switch>
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
