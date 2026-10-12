import type { ChangeEvent } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Field, type FieldProps } from "./Field";

/**
 * `Field` conectado a react-hook-form como campo CONTROLADO (value/onChange
 * explícitos), no vía `register()` (no controlado). react-aria-components
 * `Input` dispara un re-render interno al pasar el cursor por encima
 * (useHover) que, en modo no controlado, puede dejar el campo en blanco
 * sin que nada en nuestro código lo pida — reproducido y confirmado con
 * react-aria-components 1.22.1. Al ser controlado, React vuelve a aplicar
 * `value` en cada commit sin importar qué dispare el re-render, así que
 * el valor sobrevive. Usar esto (no `register()`) para cualquier campo
 * que pueda mostrarse con contenido ya cargado (editar) y quedar sin foco.
 */
export function ControlledField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  inputProps,
  ...fieldProps
}: Omit<FieldProps, "isInvalid" | "errorMessage"> & {
  control: Control<TFieldValues>;
  name: TName;
  inputProps?: Omit<NonNullable<FieldProps["inputProps"]>, "value" | "onChange" | "onBlur" | "ref">;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const mergedInputProps = {
          ...inputProps,
          value: field.value ?? "",
          onChange: (e: ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value),
          onBlur: field.onBlur,
          ref: field.ref,
        };
        return (
          <Field
            {...fieldProps}
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message}
            inputProps={mergedInputProps}
          />
        );
      }}
    />
  );
}
