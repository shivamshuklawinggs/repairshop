
import { Expression } from "mongoose";
/**
 * ========================================
 * Carrier & Customer Financial Calculations
 * ========================================
 * These helper functions perform consistent arithmetic
 * calculations for carrier and customer amounts.
 *
 * ✅ Safe default handling (no NaN or undefined math)
 * ✅ Clean, DRY reusable arithmetic helpers
 * ✅ Aligned formulas with Mongo aggregation utilities
 */

/* -------------------------------------------------------------------------- */
/*                               Basic Utilities                              */
/* -------------------------------------------------------------------------- */


/**
 * ========================================
 * MongoDB Aggregation Helper Functions
 * ========================================
 * These helper utilities generate safe and reusable
 * MongoDB aggregation expressions for arithmetic and
 * carrier payment calculations.
 *
 * ✅ Prevents null/undefined crashes using `$ifNull`
 * ✅ Simplifies arithmetic logic (add, subtract, divide, etc.)
 * ✅ Improves maintainability of Mongo aggregation pipelines
 */

/* -------------------------------------------------------------------------- */
/*                               Basic Helpers                                */
/* -------------------------------------------------------------------------- */

/**
 * Wraps a MongoDB expression in `$ifNull` to provide a default fallback value.
 * @param expr - The MongoDB expression to wrap
 * @param def - Default value if `expr` is null or undefined
 */
export const wrap = (expr: Expression, def: Expression = 0): Expression => ({
  $ifNull: [expr, def],
});

/**
 * mongoReportScore
 * -----------------
 * Computes a report-based score on a 1–5 scale from counts of report types.
 * Positive: appreciation (+1)
 * Negative: warning (-1), issue (-2), complaint (-3)
 *
 * Formula (clamped to [1,5]):
 *   score = 5 + (app*1 + warn*(-1) + issue*(-2) + comp*(-3)) / max(1, total)
 */
export const mongoReportScore = (
  {
    warning,
    issue,
    complaint,
  }: {
    warning: Expression;
    issue: Expression;
    complaint: Expression;
  }
): Expression => ({
  $let: {
    vars: {
      warn: wrap(warning, 0),
      iss: wrap(issue, 0),
      comp: wrap(complaint, 0),
    },
    in: {
      $let: {
        vars: {
          total: {
            $max: [
              1,
              { $add: ["$$warn", "$$iss", "$$comp"] },
            ],
          },
          weighted: {
            $add: [
              { $multiply: ["$$warn", -1] },
              { $multiply: ["$$iss", -2] },
              { $multiply: ["$$comp", -3] },
            ],
          },
        },
        in: {
          $min: [
            5,
            {
              $max: [
                1,
                {
                  $add: [
                    5,
                    { $divide: ["$$weighted", "$$total"] },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
  },
});

/**
 * Adds multiple MongoDB expressions together safely.
 * @example add("$price", "$tax", 5)
 */
export const add = (...args: Expression[]): Expression => ({
  $add: args.map((a) => wrap(a)),
});

/**
 * Sums multiple MongoDB expressions safely.
 * @example sum("$price", "$tax", 5)
 */
export const sum = (a:Expression): Expression => ({
  $sum:  wrap(a),
});

/**
 * Subtracts one MongoDB expression from another safely.
 * @example subtract("$amount", "$discount")
 */
export const subtract = (a: Expression, b: Expression): Expression => ({
  $subtract: [wrap(a), wrap(b)],
});

/**
 * Multiplies multiple MongoDB expressions together safely.
 * @example multiply("$rate", "$hours")
 */
export const multiply = (...args: Expression[]): Expression => ({
  $multiply: args.map((a) => wrap(a)),
});

/**
 * Divides one MongoDB expression by another safely (avoids division by zero).
 * @example divide("$total", "$count")
 */
export const divide = (a: Expression, b: Expression = 1): Expression => ({
  $divide: [wrap(a), wrap(b, 1)],
});

/**
 * Computes the sum of array values safely.
 * @example sumArray("charges.amount")
 */
export const sumArray = (field: string): Expression => ({
  $sum: wrap(`${field}`, []),
});
/**
 * Returns the absolute value of a MongoDB expression.
 * @example abs("$endingBalanceNumeric")
 * @example abs(subtract("$credit", "$debit"))
 */
export const Mongoabs = (expression: Expression): Expression => ({
  $abs: wrap(expression),
});

/**
 * Converts a MongoDB expression to a string.
 * @example toString("$amount")
 * @example toString(abs("$amount"))
 */
export const mongotoString = (expression: Expression): Expression => ({
  $toString: wrap(expression),
});





