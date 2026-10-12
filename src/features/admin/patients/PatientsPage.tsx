import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { SearchX, Users, UserRound } from "lucide-react";
import { es } from "@/i18n/es";
import { Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { cardEnter, staggerList } from "@/lib/motion";
import { AdminLayout } from "../AdminLayout";
import { usePatientSearch } from "../appointments/queries";

export function PatientsPage() {
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [query, setQuery] = useState("");
  const searchQuery = usePatientSearch(query);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <AdminLayout>
      <Eyebrow>{es.admin.nav.pacientes}</Eyebrow>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display mt-1 flex items-center gap-2.5 text-3xl text-ink outline-none"
      >
        <Users aria-hidden="true" className="h-7 w-7 text-accent" strokeWidth={2.25} />
        {es.admin.pacientes.titulo}
      </h1>
      <div className="mt-6 max-w-sm">
        <Field
          label={es.admin.pacientes.buscarPlaceholder}
          inputProps={{ value: query, onChange: (e) => setQuery(e.target.value) }}
        />
      </div>

      {searchQuery.isLoading ? (
        <div className="mt-6">
          <SkeletonList count={4} />
        </div>
      ) : searchQuery.isError ? (
        <div className="mt-6">
          <ErrorState onRetry={() => searchQuery.refetch()} />
        </div>
      ) : searchQuery.data && searchQuery.data.length > 0 ? (
        <motion.ul initial="hidden" animate="visible" variants={staggerList} className="mt-6 flex flex-col gap-2.5">
          {searchQuery.data.map((p) => (
            <motion.li key={p.id} variants={cardEnter}>
              <Card onPress={() => navigate(`/admin/pacientes/${p.id}`)}>
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
        <div className="mt-6">
          <EmptyState
            icon={<SearchX aria-hidden="true" className="h-8 w-8" strokeWidth={2.25} />}
            title={es.admin.pacientes.sinResultados}
          />
        </div>
      )}
    </AdminLayout>
  );
}
