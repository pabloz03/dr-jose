import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";
import { ControlledField } from "@/components/ui/ControlledField";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog } from "@/components/ui/Dialog";
import { showToast } from "@/components/ui/Toast";
import { useSavePatient } from "./queries";
import { patientFormSchema, type PatientFormValues } from "./schemas";
import type { Tables } from "@/lib/database.types";

type Patient = Tables<"patients">;

export function PatientFormDialog({
  patient,
  isOpen,
  onOpenChange,
}: {
  patient?: Patient;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const savePatient = useSavePatient();
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, formState, reset } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: { full_name: "", birth_date: "", is_self: false },
  });

  useEffect(() => {
    if (patient) {
      reset({ full_name: patient.full_name, birth_date: patient.birth_date ?? "", is_self: patient.is_self });
    }
  }, [patient, reset]);

  async function onSubmit(values: PatientFormValues) {
    setFormError(null);
    try {
      await savePatient.mutateAsync({
        id: patient?.id,
        full_name: values.full_name,
        birth_date: values.birth_date || null,
        is_self: values.is_self,
      });
      onOpenChange(false);
      showToast({ title: es.familia.guardadoOk, tone: "success" });
    } catch {
      setFormError(es.common.errorAccionGenerico);
    }
  }

  return (
    <Dialog
      title={patient ? es.familia.editarPaciente : es.familia.agregarPaciente}
      isOpen={isOpen}
      isDismissable
      onOpenChange={onOpenChange}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <ControlledField control={control} name="full_name" label={es.familia.nombreLabel} isRequired />
        <ControlledField
          control={control}
          name="birth_date"
          label={es.familia.fechaNacimientoLabel}
          inputProps={{ type: "date" }}
        />
        <Controller
          control={control}
          name="is_self"
          render={({ field }) => (
            <Checkbox isSelected={field.value} onChange={field.onChange}>
              {es.familia.esUsted}
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
            {es.common.guardar}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
