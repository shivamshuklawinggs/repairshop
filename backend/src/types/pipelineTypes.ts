import { PipelineStage } from "mongoose";

export type pipelineTypes = Array<PipelineStage.Project | PipelineStage.Unset | PipelineStage.Sort | PipelineStage.Lookup | PipelineStage.Unwind | PipelineStage.AddFields | PipelineStage.Group | PipelineStage.Match | PipelineStage.Skip | PipelineStage.Limit>