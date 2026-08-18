import { PipelineStage } from "mongoose";
type PaginationStages = Array<
  PipelineStage.Skip | PipelineStage.Limit
>;
// create pagination to use in aggreagate and finds
const pagination = (
    page: number | string,
    limit: number | string):PaginationStages  => {
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;
    return [
        { $skip: skip, },
        { $limit: limitNumber, }
    ]
}
export default pagination;
