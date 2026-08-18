import { Request, Response, NextFunction } from 'express';
import Notificationservice from '../../models/Notification.model';
import { AppError } from 'middlewares/error';
import { Types } from 'mongoose';
import { INotification } from '../../models/Notification.model';
import { parseJSON } from 'libs';
interface NotificationPayload {
  createdBy?: string;
  [key: string]: any; // Allow additional properties
}
/**
 * @description Create a new item service
 * @type POST
 * @path /api/item-services
 */
const createNotificationservice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await Notificationservice.create(req.body);
    res.status(201).json({ data: data, success: true, statusCode: 201 });
  } catch (error) {
    next(error);
  }
};

const createNotification = async (payload: NotificationPayload = {}): Promise<any> => {
  try {
    const data = Object.keys(payload).length > 0 && payload.createdBy && await Notificationservice.create(payload);
    return data ? data : false;
  } catch (error) {
    console.warn(error);
  }
};

/**
 * @description Get all item services
 * @type GET
 * @path /api/item-services
 */
const getAllNotificationservices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matchStage: Record<string, any> = {
      companyId: new Types.ObjectId(res.locals.companyId)

    }
    const { isRead } = req.query
    if (isRead) {
      matchStage["isRead"] = parseJSON(isRead as string)
    }
    const Notificationservices = await Notificationservice.aggregate<Omit<INotification, keyof Document>>([
      {
        $match: matchStage
      },
      {
        $sort: { createdAt: -1 }
      },
    ]);


    res.status(200).json({
      data: Notificationservices,
      success: true,
      statusCode: 200
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get an item service by ID
 * @type GET
 * @path /api/item-services/:id
 */
const getNotificationserviceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await Notificationservice.findById(req.params.id);
    if (data) {
      res.status(200).json({ data: data, success: true, statusCode: 200 });
    } else {
      throw new AppError('Item Service not found', 404);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @description Update an item service by ID
 * @type PUT
 * @path /api/item-services/:id
 */
const updateNotificationservice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updated = await Notificationservice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (updated) {
      res.status(200).json({ data: updated, success: true, statusCode: 200 });
    } else {
      throw new AppError('Item Service not found', 404);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @description Delete an item service by ID
 * @type DELETE
 * @path /api/item-services/:id
 */
const deleteNotificationservice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await Notificationservice.findByIdAndDelete(req.params.id);
    if (deleted) {
      res.status(204).json({ success: true, statusCode: 204 });
    } else {
      throw new AppError('Item Service not found', 404);
    }
  } catch (error) {
    next(error);
  }
};
const readAllNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ids: Types.ObjectId[] = req.body.ids.map((id: string) => new Types.ObjectId(id))
    const notifications = await Notificationservice.updateMany({ _id: { $in: ids } }, { isRead: true });
    res.status(200).json({ data: notifications, success: true, statusCode: 200 });
  } catch (error) {
    next(error);
  }
};



export {
  createNotificationservice,
  getAllNotificationservices,
  getNotificationserviceById,
  updateNotificationservice,
  deleteNotificationservice,
  createNotification,
  readAllNotifications,
};
