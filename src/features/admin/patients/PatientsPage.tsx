import { useEffect, useRef, useState } from "react";
import { es } from "@/i18n/es";
import { Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { AdminLayout } from "../AdminLayout";
import { usePatientSearch } from "../appointments/queries";

export function PatientsPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [query, setQuery] = useState("");
  const searchQuery = usePatientSearch(query);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <AdminLayout>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">
        {es.admin.pacientes.titulo}
      </h1>
      <div className="mt-4 max-w-sm">
        <Field
          label={es.admin.pacientes.buscarPlaceholder}
          inputProps={{ value: query, onChange: (e) => setQuery(e.target.value) }}
        />
      </div>

      {query.trim().length >= 2 ? (
        searchQuery.data && searchQuery.data.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {searchQuery.data.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-md border border-line bg-surface p-3">
                <span className="font-medium text-ink">{p.full_name}</span>
                {!p.guardian_user_id ? (
                  <Badge tone="neutral" icon="●">
                    {es.admin.pacientes.invitado}
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">{es.admin.pacientes.sinResultados}</p>
        )
      ) : null}
    </AdminLayout>
  );
}
