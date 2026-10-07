export const spring = { type: "spring", stiffness: 300, damping: 30 } as const;
export const fade = { duration: 0.15 } as const;

export const stepVariants = {
  enter: (dir: 1 | -1) => ({ opacity: 0, x: 20 * dir }),
  center: { opacity: 1, x: 0, transition: { duration: 0.24 } },
  exit: (dir: 1 | -1) => ({ opacity: 0, x: -20 * dir, transition: { duration: 0.15 } }),
};

/** Tarjeta que aparece en una lista (citas, pacientes, filas de admin). Todas finitas — regla dura #11 prohíbe animación infinita. */
export const cardEnter = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

/** Stagger corto para listas: cada hijo usa `cardEnter`, el padre define el delay entre ellos. */
export const staggerList = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

/** Micro-feedback de tap para tarjetas/filas interactivas que no son <Button> (que ya tiene su propio scale vía data-[pressed]). */
export const pressFeedback = { scale: 0.98 };
