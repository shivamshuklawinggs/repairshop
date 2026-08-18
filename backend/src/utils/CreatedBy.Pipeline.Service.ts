import { Request } from "express";
import { PipelineStage, Types } from "mongoose";
import { Role } from "microservices/auth-service/types";
import { IUserDocument } from "models/user.model";

/**
 * Builds an aggregation pipeline to fetch services based on user access control.
 * 
 * @param res - Express response object containing authenticated user data in res.locals
 * @param isCustomer - Boolean flag indicating if the service is for a customer
 * @param matchStage - Additional custom match filters
 * 
 * @returns MongoDB aggregation pipeline stages
 */
const getServicesByCreatedBy = ({
  req,
  matchStage,
}: {
  req: Request;
  matchStage: Record<string, any>;
}): Array<PipelineStage.Match> => {
  const {
    role,
    _id: userId,
    ownerAdminId,
  } = req.user as IUserDocument;

  const currentRole: Role = role;

  const oid = (id: any) => new Types.ObjectId(id);

  /**
   * Safely append OR conditions without overriding existing $or
   */
  const addOrCondition = (conditions: Record<string, any>[]) => {
    if (!matchStage.$and) {
      matchStage.$and = [];
    }

    matchStage.$and.push({
      $or: conditions,
    });
  };

  switch (currentRole) {
    /**
     * 🧮 ACCOUNTANT
     */
    case Role.ACCOUNTANT:
      addOrCondition([
        { createdBy: oid(userId) },
        { ownerAdminId: oid(ownerAdminId) },
      ]);
      break;

    /**
     * 🧑‍💼 ADMIN
     */
    case Role.ADMIN:
      addOrCondition([
        { createdBy: oid(userId) },
        { ownerAdminId: oid(ownerAdminId) },
      ]);
      break;
    /**
     * 🧑‍🔧 MANAGER
     */
    case Role.MANAGER:
      addOrCondition([
        { createdBy: oid(userId) },
        { manager: oid(userId) },
      ]);
      break;

    /**
     * 🧍 DEFAULT USER
     */
    default:
      addOrCondition([{ createdBy: oid(userId) }]);
      break;
  }


  return [
    {
      $match: matchStage,
    },
  ];
};
const getServicesByCreatedByKey=({
  req,
  matchStage,
}: {
  req:Request,
  matchStage:Record<string, any>
}): string => {

  // Extract user information from res.locals

  const {role,_id:userId,createdBy} = req.user as IUserDocument
  const currentRole: Role = role;
  const oid = (id: any) => new Types.ObjectId(id);
  // Filter to control access based on user's role
  const createdByFilter: Record<string, any> = {};

  switch (currentRole) {
    /**
     * 🧮 ACCOUNTANT
     * Can see:
     * - Records created by themselves
     */
    case Role.ACCOUNTANT:
      createdByFilter["$or"] = [
        { createdBy: oid(userId) },
        { "createdUser.createdBy": oid(createdBy) },
      ];
      break;
    /**
     * 🧑‍💼 ADMIN
     * Can see:
     * - Records they created
     * - Records created by users they created
     */
    case Role.ADMIN:
      createdByFilter["$or"] = [
        { createdBy: oid(userId) },
        { "createdUser.createdBy": oid(userId) },
      ];
      break;
    /**
     * 🧑‍🔧 MANAGER
     * Can see:
     * - Records they created
     * - Records created by users assigned to them (i.e., users where this manager is set)
     */
    case Role.MANAGER:
      createdByFilter["$or"] = [
        { createdBy: oid(userId) },
        { "createdUser.manager": oid(userId) },
      ];
      break;
    /**
     * 🧍 DEFAULT USER
     * Can only see:
     * - Records they created
     */
    default:
      createdByFilter["$or"] = [{ createdBy: oid(userId) }];
      break;
  }
  // Build and return the MongoDB aggregation pipeline
  return  JSON.stringify({...matchStage,...createdByFilter })
   
};
export { getServicesByCreatedBy,getServicesByCreatedByKey };
