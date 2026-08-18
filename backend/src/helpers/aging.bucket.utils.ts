export const getAgingConditions = (
  now: Date,
  date30: Date,
  date60: Date,
  date90: Date
) => ({
  current: { $gte: ["$postingDate", now] },

  due_0_30: {
    $and: [
      { $lt: ["$postingDate", now] },
      { $gte: ["$postingDate", date30] },
    ],
  },

  due_31_60: {
    $and: [
      { $lt: ["$postingDate", date30] },
      { $gte: ["$postingDate", date60] },
    ],
  },

  due_61_90: {
    $and: [
      { $lt: ["$postingDate", date60] },
      { $gte: ["$postingDate", date90] },
    ],
  },

  due_90_plus: { $lt: ["$postingDate", date90] },
});
export const getAgingBuckets = (
  now: Date,
  date30: Date,
  date60: Date,
  date90: Date
) => {
  const c = getAgingConditions(now, date30, date60, date90);

  return {
    currentDueAmount: {
      $sum: { $cond: [c.current, "$balanceDue", 0] },
    },
    due_0_30: {
      $sum: { $cond: [c.due_0_30, "$balanceDue", 0] },
    },
    due_31_60: {
      $sum: { $cond: [c.due_31_60, "$balanceDue", 0] },
    },
    due_61_90: {
      $sum: { $cond: [c.due_61_90, "$balanceDue", 0] },
    },
    due_90_plus: {
      $sum: { $cond: [c.due_90_plus, "$balanceDue", 0] },
    },
  };
};
export const getAgingBucketFields = (
  now: Date,
  date30: Date,
  date60: Date,
  date90: Date
) => {
  const c = getAgingConditions(now, date30, date60, date90);

  return {
    bucket: {
      $switch: {
        branches: [
          { case: c.current, then: "Current" },
          { case: c.due_0_30, then: "0-30" },
          { case: c.due_31_60, then: "31-60" },
          { case: c.due_61_90, then: "61-90" },
        ],
        default: "90+",
      },
    },

    bucketOrder: {
      $switch: {
        branches: [
          { case: c.current, then: 0 },
          { case: c.due_0_30, then: 1 },
          { case: c.due_31_60, then: 2 },
          { case: c.due_61_90, then: 3 },
        ],
        default: 4,
      },
    },
  };
};
