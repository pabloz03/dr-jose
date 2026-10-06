export const spring = { type: "spring", stiffness: 300, damping: 30 } as const;
export const fade = { duration: 0.15 } as const;

export const stepVariants = {
  enter: (dir: 1 | -1) => ({ opacity: 0, x: 20 * dir }),
  center: { opacity: 1, x: 0, transition: { duration: 0.24 } },
  exit: (dir: 1 | -1) => ({ opacity: 0, x: -20 * dir, transition: { duration: 0.15 } }),
};
