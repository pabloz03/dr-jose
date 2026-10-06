---
description: Corre la suite de casos límite del motor de disponibilidad (get_available_slots)
---
Ejecuta contra el proyecto/branch de Supabase configurado los tests de `supabase/tests/slots/`, cubriendo como mínimo:
día sin horario · excepción cerrada · excepción con horario distinto · bloqueo parcial · bloqueo que cruza medianoche · cita existente · buffer entre citas · anticipación mínima (`min_lead_hours`) · ventana máxima (`max_booking_days`) · fin de mes · domingo · concurrencia (dos reservas simultáneas al mismo slot).

Reporta cada caso como pass/fail con el `slot_start` esperado vs obtenido. Si algo falla, no lo "arregles" relajando el test — investiga si el bug está en `get_available_slots` o en el caso de prueba.
