-- staff_read (0010, select true) ya cubre todo lo que staff_self_read
-- cubría (su propia fila) y más — la deja completamente redundante, no
-- un caso de "OR semánticamente real" como patients/profiles/appointments.
drop policy staff_self_read on staff;
