import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Users, UserRound } from "lucide-react";
import { es } from "@/i18n/es";
import { Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cardEnter, staggerList } from "@/lib/motion";
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
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display flex items-center gap-2 text-2xl text-ink outline-none"
      >
        <Users aria-hidden="true" className="h-6 w-6 text-accent" strokeWidth={2.25} />
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
          <motion.ul initial="hidden" animate="visible" variants={staggerList} className="mt-4 flex flex-col gap-2">
            {searchQuery.data.map((p) => (
              <motion.li key={p.id} variants={cardEnter}>
                <Card>
                  <div className="flex items-center gap-2">
                    <UserRound aria-hidden="true" className="h-4 w-4 text-muted" strokeWidth={2.25} />
                    <span className="font-medium text-ink">{p.full_name}</span>
                    {!p.guardian_user_id ? (
                      <Badge tone="neutral" icon="●">
                        {es.admin.pacientes.invitado}
                      </Badge>
                    ) : null}
                  </div>
                </Card>
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <p className="mt-4 text-sm text-muted">{es.admin.pacientes.sinResultados}</p>
        )
      ) : null}
    </AdminLayout>
  );
}
