import moment from "moment";
import { AppError } from "middlewares/error";

export type FilterByDateField =
  | "createdAt"
  | "postingDate"
  | "paymentDate"
  | "dueDate";

export default class DateTimeFilter {
  // =====================================================
  // FILTER BY CUSTOM DATE RANGE
  // =====================================================
  static FilterByDate({
    fromDate,
    toDate,
    initialMatchStage = {},
    field = "createdAt",
  }: {
    fromDate?: string;
    toDate?: string;
    field: FilterByDateField;
    initialMatchStage: Record<string, any>;
  }): {
    initalMatchStage: Record<string, any>;
    start?: Date;
    end?: Date;
  } {
    let start: Date | undefined;
    let end: Date | undefined;
   
    // ============================================
    // FROM DATE
    // ============================================
    if (fromDate) {
      start = moment(new Date(fromDate), "YYYY-MM-DD")
        .startOf("day")
        .toDate();
    }

    // ============================================
    // TO DATE
    // ============================================
    if (toDate) {
      end = moment(new Date(toDate), "YYYY-MM-DD")
        .endOf("day")
        .toDate();
    }

    // ============================================
    // VALIDATION: fromDate should not be greater than toDate
    // ============================================
    if (start && end && start > end) {
      throw new AppError("From Date cannot be greater than To Date", 400);
    }

    // ============================================
    // BUILD QUERY
    // ============================================
    if (start && end) {
      initialMatchStage[field] = {
        $gte: start,
        $lte: end,
      };
    } else if (start) {
      initialMatchStage[field] = {
        $gte: start,
      };
    } else if (end) {
      initialMatchStage[field] = {
        $lte: end,
      };
    }

    return {
      initalMatchStage: initialMatchStage,
      start,
      end,
    };
  }
}