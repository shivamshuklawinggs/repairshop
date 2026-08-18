import { ReportData } from "@/types"
import { ProfitAndLossTypeIds } from "@/types/enum"

export const findReportByTypeId = (typeId: ProfitAndLossTypeIds, reportData: ReportData) => {
  return reportData.data.find((item)=>item.typeId==typeId)
}