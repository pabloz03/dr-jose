import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { es } from "@/i18n/es";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
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
  const { control, register, handleSubmit, formState } = useForm<
    z.input<typeof appointmentTypeFormSchema>,
    unknown,
    z.output<typeof appointmentTypeFormSchema>
  >({
    resolver: zodResolver(appointmentTypeFormSchema),
    defaultValues: {
      name: type?.name ?? "",
      duration_min: type?.duration_min ?? 20,
      buffer_after_min: type?.buffer_after_min ?? 0,
      is_active: type?.is_active ?? true,
      bookable_online: type?.bookable_online ?? true,
    },
  });

  async function onSubmit(values: AppointmentTypeFormValues) {
    await saveType.mutateAsync({ id: type?.id, ...values, sort: type?.sort ?? 0 });
    onOpenChange(false);
  }

  return (
    <Dialog
      title={type ? es.admin.ajustes.tipoEditar : es.admin.ajustes.tipoAgregar}
      isOpen={isOpen}
      isDismissable
      onOpenChange={onOpenChange}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field
          label={es.admin.ajustes.tipoNombreLabel}
          isRequired
          isInvalid={!!formState.errors.name}
          errorMessage={formState.errors.name?.message}
          inputProps={register("name")}
        />
        <Field
          label={es.admin.ajustes.tipoDuracionLabel}
          isRequired
          isInvalid={!!formState.errors.duration_min}
          errorMessage={formState.errors.duration_min?.message}
          inputProps={{ type: "number", min: 5, step: 5, ...register("duration_min") }}
        />
        <Field
          label={es.admin.ajustes.tipoBufferLabel}
          isInvalid={!!formState.errors.buffer_after_min}
          errorMessage={formState.errors.buffer_after_min?.message}
          inputProps={{ type: "number", min: 0, step: 5, ...register("buffer_after_min") }}
        />
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <Checkbox isSelected={field.value} onChange={field.onChange}>
              {es.admin.ajustes.tipoActivoLabel}
            </Checkbox>
          )}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="quiet" onPress={() => onOpenChange(false)}>
            {es.common.cancelar}
          </Button>
          <Button type="submit" variant="primary" isPending={formState.isSubmitting}>
            {es.common.guardar}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
