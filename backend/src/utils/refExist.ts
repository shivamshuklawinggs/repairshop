import { AppError } from "middlewares/error";
import mongoose from "mongoose";

const refExist = async (modelName: string, id: string, refname: string, session: any) => {
   
        const existPaymentTerms = await mongoose.model(modelName).findOne({ [refname]: id }).session(session);
         if(existPaymentTerms){
            throw new AppError(`${modelName} cannot be deleted because it is used in ${refname}`, 400);
         }
    
};

export default refExist