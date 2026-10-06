# Citas Ortodoncia — Reglas del proyecto

## Comandos
- dev: `pnpm dev` · build: `pnpm build` · typecheck: `pnpm tsc --noEmit`
- lint: `pnpm lint` · unit: `pnpm test` · e2e: `pnpm e2e` · a11y: `pnpm e2e --grep @a11y`
- db (sin Docker local, proyecto/branch Supabase Cloud): `supabase link --project-ref <ref>` · `supabase db push` para aplicar migraciones · `supabase db diff` antes de crear una nueva
- tipos: `supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`
- deploy: build estático (`pnpm build` → `dist/`) subido por FTP a hosting compartido Hostinger; sin funciones serverless en el frontend, toda lógica server-side vive en Supabase Edge Functions

## Reglas duras
1. WCAG 2.2 AA es condición de merge. Toda pantalla nueva pasa axe (0 críticas/serias) y navegación solo por teclado.
2. Prohibido hex/rgb fuera de `styles/tokens.css`. Usar tokens.
3. Fechas: solo vía `lib/tz.ts` (`America/Guatemala`). Prohibido `new Date("YYYY-MM-DDTHH:mm")` sin zona y asumir DST.
4. Un GET nunca muta estado. Acciones de email = POST desde botón.
5. La disponibilidad se calcula en Postgres (`get_available_slots`). El cliente nunca decide si un slot es válido.
6. Doble reserva se previene en BD (exclusion constraint). Manejar el error `23P01` con mensaje amable.
7. RLS en TODAS las tablas. Pacientes solo ven lo suyo (tutor → sus pacientes → sus citas). Staff con dos niveles: `is_doctor()` (config) vs `is_staff()` (doctor + asistente, operación). `patients.guardian_user_id` es nullable (paciente invitado sin cuenta); reclamar un paciente invitado requiere confirmación explícita del tutor, nunca merge automático por coincidencia de email.
8. Sin PII en logs ni en analítica.
9. Texto de UI en español de Guatemala, tratamiento "usted", claro y corto. Todo string en `src/i18n/es.ts`.
10. Estado nunca solo por color: texto + icono.
11. Motion: `MotionConfig reducedMotion="user"`. Sin animaciones infinitas. Duraciones 120–320 ms.
12. Glass: opacidad ≥ 0.85 (claro) / ≥ 0.90 (oscuro) bajo texto; fallbacks para `prefers-reduced-transparency`, `forced-colors` y sin `backdrop-filter`. Máx. 2 capas glass por viewport; nunca en calendario ni listas con scroll.
13. Objetivos táctiles ≥ 44×44 px. Reflow a 320 px sin scroll horizontal.
14. Al cambiar de paso/ruta: mover el foco al `<h1>`/`<h2>` nuevo y anunciar por `aria-live`.

## Definición de hecho (DoD)
- Tipos y lint limpios · tests unitarios y e2e del flujo · axe sin violaciones · probado a 320/375/768/1280 px
- Probado con teclado y con reduced motion · estados loading/empty/error implementados
- Migraciones con RLS probadas · sin `any` · copy revisado por subagente `copy-gt`

## Subagentes
- `a11y-auditor` en cada PR de UI · `db-reviewer` en cada migración · `tz-reviewer` en cada cambio con fechas · `copy-gt` en copy y emails