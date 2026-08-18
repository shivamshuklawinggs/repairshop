import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AppError } from 'middlewares/error';
import { Role } from 'microservices/auth-service/types';
import { InvoiceReminderTemplateService } from './services/InvoiceReminderTemplate.service';

/**
 * @description Check if user has permission to manage templates
 * Only ADMIN and ACCOUNTANT roles can manage templates
 */
const checkTemplatePermission = (req: Request) => {
  const userRole = req.user?.role;
  if (userRole !== Role.ADMIN && userRole !== Role.ACCOUNTANT) {
    throw new AppError('Only Admin and Accountant can manage invoice reminder templates', 403);
  }
};

/**
 * @description Initialize default templates for a company
 * @type POST
 * @path /api/invoice-reminder-templates/initialize
 */
const initializeDefaultTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    checkTemplatePermission(req);

    const { companyId, ownerAdminId } = req.body;
    const userId = req.user?._id;

    if (!companyId || !ownerAdminId) {
      throw new AppError('Company ID and Owner Admin ID are required', 400);
    }

    const result = await InvoiceReminderTemplateService.initializeDefaultTemplates(
      new Types.ObjectId(String(companyId)),
      new Types.ObjectId(String(ownerAdminId)),
      new Types.ObjectId(String(userId))
    );

    if (!result.success) {
      throw new AppError(result.message || 'Failed to initialize default templates', 500);
    }

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Create a new template
 * @type POST
 * @path /api/invoice-reminder-templates
 */
const createTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    checkTemplatePermission(req);

    const {
      templateType,
      name,
      subject,
      htmlContent,
      daysBeforeDue,
      daysAfterDue,
      frequency,
      customIntervalDays,
      maxReminders,
      sendTime
    } = req.body;
    const companyId = res.locals.companyId;
    const ownerAdminId = req.user?.ownerAdminId;
    const userId = req.user?._id;

    const result = await InvoiceReminderTemplateService.createTemplate({
      templateType,
      name,
      subject,
      htmlContent,
      daysBeforeDue,
      daysAfterDue,
      frequency,
      customIntervalDays,
      maxReminders,
      sendTime,
      companyId: new Types.ObjectId(String(companyId)),
      ownerAdminId: new Types.ObjectId(String(ownerAdminId)),
      userId: new Types.ObjectId(String(userId))
    });

    if (!result.success) {
      throw new AppError(result.message || 'Failed to create template', 500);
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Template created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get all templates for a company
 * @type GET
 * @path /api/invoice-reminder-templates
 */
const getTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    checkTemplatePermission(req);

    const companyId = res.locals.companyId;

    const result = await InvoiceReminderTemplateService.getTemplatesByCompany(
      new Types.ObjectId(String(companyId))
    );

    if (!result.success) {
      throw new AppError(result.message || 'Failed to fetch templates', 500);
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get active template by type
 * @type GET
 * @path /api/invoice-reminder-templates/active/:type
 */
const getActiveTemplateByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    checkTemplatePermission(req);

    const { type } = req.params;
    const companyId = res.locals.companyId;

    if (!['before', 'after', 'on_due'].includes(type)) {
      throw new AppError('Invalid template type. Must be one of: before, after, on_due', 400);
    }

    const result = await InvoiceReminderTemplateService.getActiveTemplateByType(
      new Types.ObjectId(String(companyId)),
      type as 'before' | 'after' | 'on_due'
    );

    if (!result.success) {
      throw new AppError(result.message || 'Failed to fetch template', 404);
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get template by ID
 * @type GET
 * @path /api/invoice-reminder-templates/:id
 */
const getTemplateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    checkTemplatePermission(req);

    const { id } = req.params;
    const companyId = res.locals.companyId;

    const result = await InvoiceReminderTemplateService.getTemplateById(
      new Types.ObjectId(String(id)),
      new Types.ObjectId(String(companyId))
    );

    if (!result.success) {
      throw new AppError(result.message || 'Template not found', 404);
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Update template
 * @type PUT
 * @path /api/invoice-reminder-templates/:id
 */
const updateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    checkTemplatePermission(req);

    const { id } = req.params;
    const {
      name,
      subject,
      htmlContent,
      isActive,
      daysBeforeDue,
      daysAfterDue,
      frequency,
      customIntervalDays,
      maxReminders,
      sendTime
    } = req.body;
    const companyId = res.locals.companyId;
    const userId = req.user?._id;

    const result = await InvoiceReminderTemplateService.updateTemplate(
      new Types.ObjectId(String(id)),
      new Types.ObjectId(String(companyId)),
      {
        name,
        subject,
        htmlContent,
        isActive,
        daysBeforeDue,
        daysAfterDue,
        frequency,
        customIntervalDays,
        maxReminders,
        sendTime,
        userId: new Types.ObjectId(String(userId))
      }
    );

    if (!result.success) {
      throw new AppError(result.message || 'Failed to update template', 500);
    }

    res.status(200).json({
      success: true,
      data: result.data,
      message: 'Template updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Delete template
 * @type DELETE
 * @path /api/invoice-reminder-templates/:id
 */
const deleteTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    checkTemplatePermission(req);

    const { id } = req.params;
    const companyId = res.locals.companyId;

    const result = await InvoiceReminderTemplateService.deleteTemplate(
      new Types.ObjectId(String(id)),
      new Types.ObjectId(String(companyId))
    );

    if (!result.success) {
      throw new AppError(result.message || 'Failed to delete template', 500);
    }

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Set template as active
 * @type PUT
 * @path /api/invoice-reminder-templates/:id/set-active
 */
const setActiveTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    checkTemplatePermission(req);

    const { id } = req.params;
    const companyId = res.locals.companyId;
    const userId = req.user?._id;

    const result = await InvoiceReminderTemplateService.setActiveTemplate(
      new Types.ObjectId(String(id)),
      new Types.ObjectId(String(companyId)),
      new Types.ObjectId(String(userId))
    );

    if (!result.success) {
      throw new AppError(result.message || 'Failed to set active template', 500);
    }

    res.status(200).json({
      success: true,
      data: result.data,
      message: 'Template set as active successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Duplicate template
 * @type POST
 * @path /api/invoice-reminder-templates/:id/duplicate
 */
const duplicateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    checkTemplatePermission(req);

    const { id } = req.params;
    const companyId = res.locals.companyId;
    const userId = req.user?._id;

    const result = await InvoiceReminderTemplateService.duplicateTemplate(
      new Types.ObjectId(String(id)),
      new Types.ObjectId(String(companyId)),
      new Types.ObjectId(String(userId))
    );

    if (!result.success) {
      throw new AppError(result.message || 'Failed to duplicate template', 500);
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Template duplicated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export {
  initializeDefaultTemplates,
  createTemplate,
  getTemplates,
  getActiveTemplateByType,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  setActiveTemplate,
  duplicateTemplate
};