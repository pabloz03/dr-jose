import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Search, SearchX, Users, UserRound } from "lucide-react";
import { es } from "@/i18n/es";
import { Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { cardEnter, staggerList } from "@/lib/motion";
import { AdminLayout } from "../AdminLayout";
import { AdminScreenHeader } from "../AdminScreenHeader";
import { AdminClinicSelector } from "../AdminClinicSelector";
import { useAdminClinic } from "../AdminClinicContext";
import { usePatientSearch } from "../appointments/queries";

export function PatientsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { selectedId } = useAdminClinic();
  const searchQuery = usePatientSearch(query, selectedId);

  return (
    <AdminLayout>
      <AdminScreenHeader icon={Users} title={es.admin.pacientes.titulo} />
      <AdminClinicSelector />

      <div className="max-w-sm">
        <Field
          label={es.admin.pacientes.buscarPlaceholder}
          inputProps={{ icon: <Search className="h-4 w-4" strokeWidth={2.25} />, value: query, onChange: (e) => setQuery(e.target.value) }}
        />
      </div>

      {searchQuery.isLoading ? (
        <SkeletonList count={4} />
      ) : searchQuery.isError ? (
        <ErrorState onRetry={() => searchQuery.refetch()} />
      ) : searchQuery.data && searchQuery.data.length > 0 ? (
        <motion.ul initial="hidden" animate="visible" variants={staggerList} className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
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
        <EmptyState icon={<SearchX aria-hidden="true" className="h-8 w-8" strokeWidth={2.25} />} title={es.admin.pacientes.sinResultados} />
      )}
    </AdminLayout>
  );
}
