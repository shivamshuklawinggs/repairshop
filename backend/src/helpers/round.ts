export const round2 = (v: number) =>
  Math.round((v + Number.EPSILON) * 100) / 100;