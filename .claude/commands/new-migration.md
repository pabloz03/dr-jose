---
description: Crea una migración SQL nueva con checklist de RLS y la registra en supabase/migrations
argument-hint: <nombre-en-kebab-case>
---
Crea `supabase/migrations/<timestamp>_$1.sql` siguiendo el estilo de las migraciones 0001–0004 existentes (ver `supabase/migrations/`).

Checklist obligatorio antes de darla por terminada:
1. ¿Toda tabla nueva tiene `alter table ... enable row level security` + al menos una policy?
2. ¿Las políticas distinguen `is_doctor()` (config) de `is_staff()` (operación, incluye asistentes) donde corresponde?
3. ¿Funciones `security definer` llevan `set search_path = public`?
4. ¿Hay índice para cada columna/rango usado en `where`/`join` de alta frecuencia (fechas, FKs)?
5. ¿Se actualizó `src/lib/database.types.ts` con `supabase gen types typescript`?
6. ¿Se agregó o actualizó el test SQL correspondiente en `supabase/tests`?

Al terminar, invoca al subagente `db-reviewer` sobre el archivo nuevo antes de hacer commit.
