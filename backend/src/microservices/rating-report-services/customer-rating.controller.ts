import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AppError } from 'middlewares/error';
import { CustomerRatingService } from './customer-rating.service';

export const addCustomerReport = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { customerId } = req.params;
        const userId = res.locals.userId;
        const { text } = req.body;

        if (!Types.ObjectId.isValid(customerId)) {
            throw new AppError('Invalid customerId', 400);
        }
        if (!text) {
            throw new AppError('Comment text is required', 400);
        }

        const doc = await CustomerRatingService.addCustomerReport(
          {
            customerId:new Types.ObjectId(customerId),
            text,
            file:req.file || undefined,
            incidentDate:req.body.incidentDate,
            type:req.body.type || "Report",
            createdBy:new Types.ObjectId(userId),
            
          }
        );

        res.status(200).json({
            success: true,
            message: 'Comment added',
            data: doc,
        });
    } catch (error) {
        next(error);
    }
};
export const deleteCustomerReport=async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try{
        const {customerId}=req.params;
        if(!Types.ObjectId.isValid(customerId)){
            throw new AppError('Invalid customerId',400);
        }
        await CustomerRatingService.deleteCustomerReport(new Types.ObjectId(customerId));
        res.status(200).json({
            success:true,
            message:'Comment deleted',
        });
    }catch(error){
        next(error);
    }
}
export const getCustomerReports=async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try{
        const {customerId}=req.params;
        if(!Types.ObjectId.isValid(customerId)){
            throw new AppError('Invalid customerId',400);
        }
        const doc=await CustomerRatingService.getCustomerReports(new Types.ObjectId(customerId));
        res.status(200).json({
            success:true,
            data:doc,
        });
    }catch(error){
        next(error);
    }
}
export const addCarrierReport = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { carrierId } = req.params;
        const userId = res.locals.userId;
        const { text } = req.body;

        if (!Types.ObjectId.isValid(carrierId)) {
            throw new AppError('Invalid carrierId', 400);
        }
        if (!text) {
            throw new AppError('Comment text is required', 400);
        }

        const doc = await CustomerRatingService.addCarrierReport(
          {
            carrierId:new Types.ObjectId(carrierId),
            text,
            file:req.file || undefined,
            incidentDate:req.body.incidentDate,
            type:req.body.type || "Report",
            createdBy:new Types.ObjectId(userId)
          }
        );

        res.status(200).json({
            success: true,
            message: 'Comment added',
            data: doc,
        });
    } catch (error) {
        next(error);
    }
};
export const deleteCarrierReport=async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try{
        const {carrierId}=req.params;
        if(!Types.ObjectId.isValid(carrierId)){
            throw new AppError('Invalid carrierId',400);
        }
        await CustomerRatingService.deleteCarrierReport(new Types.ObjectId(carrierId));
        res.status(200).json({
            success:true,
            message:'Comment deleted',
        });
    }catch(error){
        next(error);
    }
}
export const getCarrierReports=async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try{
        const {carrierId}=req.params;
        if(!Types.ObjectId.isValid(carrierId)){
            throw new AppError('Invalid carrierId',400);
        }
        const doc=await CustomerRatingService.getCarrierReports(new Types.ObjectId(carrierId));
        res.status(200).json({
            success:true,
            data:doc,
        });
    }catch(error){
        next(error);
    }
}

export const addDriverReport = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { driverId } = req.params;
        const userId = res.locals.userId;
        const { text } = req.body;

        if (!Types.ObjectId.isValid(driverId)) {
            throw new AppError('Invalid driverId', 400);
        }
        if (!text) {
            throw new AppError('Comment text is required', 400);
        }

        const doc = await CustomerRatingService.addDriverReport(
          {
            driverId:new Types.ObjectId(driverId),
            text,
            file:req.file || undefined,
            incidentDate:req.body.incidentDate,
            type:req.body.type || "Report",
            createdBy:new Types.ObjectId(userId)
          }
        );

        res.status(200).json({
            success: true,
            message: 'Comment added',
            data: doc,
        });
    } catch (error) {
        next(error);
    }
};
export const deleteDriverReport=async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try{
        const {driverId}=req.params;
        if(!Types.ObjectId.isValid(driverId)){
            throw new AppError('Invalid driverId',400);
        }
        await CustomerRatingService.deleteDriverReport(new Types.ObjectId(driverId));
        res.status(200).json({
            success:true,
            message:'Comment deleted',
        });
    }catch(error){
        next(error);
    }
}
export const getDriverReports=async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try{
        const {driverId}=req.params;
        if(!Types.ObjectId.isValid(driverId)){
            throw new AppError('Invalid driverId',400);
        }
        const doc=await CustomerRatingService.getDriverReports(new Types.ObjectId(driverId));
        res.status(200).json({
            success:true,
            data:doc,
        });
    }catch(error){
        next(error);
    }
}
export const getAverageReportRating=async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try{
        const {entityId,entityType}=req.params;
        if(!Types.ObjectId.isValid(entityId)){
            throw new AppError('Invalid entityId',400);
        }
        if(entityType!="customer" && entityType!="carrier" && entityType!="driver"){
            throw new AppError('Invalid entityType',400);
        }
        const doc=await CustomerRatingService.getAverageReportRating(new Types.ObjectId(entityId),entityType as "customer" | "carrier" | "driver");
        res.status(200).json({
            success:true,
            data:doc,
        });
    }catch(error){
        next(error);
    }
}
