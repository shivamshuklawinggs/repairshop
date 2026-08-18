import InvoiceReminderTemplate, { ReminderTemplateType, ReminderFrequency } from '../../../models/InvoiceReminderTemplate.model';
import { Types } from 'mongoose';
import defaultTemplates from './defaultTemplates.json';

interface CreateTemplateInput {
  templateType: ReminderTemplateType;
  name: string;
  subject: string;
  htmlContent: string;
  daysBeforeDue?: number;
  daysAfterDue?: number;
  frequency?: ReminderFrequency;
  customIntervalDays?: number;
  maxReminders?: number;
  sendTime?: string;
  companyId: Types.ObjectId;
  ownerAdminId: Types.ObjectId;
  userId: Types.ObjectId;
}

interface UpdateTemplateInput {
  name?: string;
  subject?: string;
  htmlContent?: string;
  isActive?: boolean;
  daysBeforeDue?: number;
  daysAfterDue?: number;
  frequency?: ReminderFrequency;
  customIntervalDays?: number;
  maxReminders?: number;
  sendTime?: string;
  userId: Types.ObjectId;
}

export class InvoiceReminderTemplateService {
  /**
   * Initialize default templates for a new company
   */
  static async initializeDefaultTemplates(companyId: Types.ObjectId, ownerAdminId: Types.ObjectId, userId: Types.ObjectId) {
    try {
      const existingTemplates = await InvoiceReminderTemplate.find({ companyId });
      if (existingTemplates.length > 0) {
        return { success: true, message: 'Templates already exist for this company' };
      }

      const templatesToCreate = defaultTemplates.map((template) => ({
        ...template,
        companyId,
        ownerAdminId,
        createdBy: userId,
        updatedBy: userId
      }));

      await InvoiceReminderTemplate.insertMany(templatesToCreate);
      return { success: true, message: 'Default templates initialized successfully' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to initialize default templates' };
    }
  }

  /**
   * Create a new template
   */
  static async createTemplate(input: CreateTemplateInput) {
    try {
      // Check if there's already an active template of this type for the company
      const existingActive = await InvoiceReminderTemplate.findOne({
        companyId: input.companyId,
        templateType: input.templateType,
        isActive: true
      });

      if (existingActive) {
        // Deactivate the existing template
        await InvoiceReminderTemplate.findByIdAndUpdate(existingActive._id, { isActive: false });
      }

      const template = new InvoiceReminderTemplate({
        ...input,
        createdBy: input.userId,
        updatedBy: input.userId
      });

      await template.save();
      return { success: true, data: template };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to create template' };
    }
  }

  /**
   * Get all templates for a company
   */
  static async getTemplatesByCompany(companyId: Types.ObjectId) {
    try {
      const templates = await InvoiceReminderTemplate.find({ companyId })
        .sort({ templateType: 1, createdAt: -1 })
        .lean();
      return { success: true, data: templates };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to fetch templates' };
    }
  }

  /**
   * Get active template by type for a company
   */
  static async getActiveTemplateByType(companyId: Types.ObjectId, templateType: ReminderTemplateType) {
    try {
      const template = await InvoiceReminderTemplate.findOne({
        companyId,
        templateType,
        isActive: true
      }).lean();

      if (!template) {
        return { success: false, message: 'No active template found for this type' };
      }

      return { success: true, data: template };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to fetch template' };
    }
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(templateId: Types.ObjectId, companyId: Types.ObjectId) {
    try {
      const template = await InvoiceReminderTemplate.findOne({
        _id: templateId,
        companyId
      }).lean();

      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      return { success: true, data: template };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to fetch template' };
    }
  }

  /**
   * Update template
   */
  static async updateTemplate(templateId: Types.ObjectId, companyId: Types.ObjectId, input: UpdateTemplateInput) {
    try {
      const template = await InvoiceReminderTemplate.findOne({
        _id: templateId,
        companyId
      });

      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      // If activating this template, deactivate other active templates of the same type
      if (input.isActive && !template.isActive) {
        await InvoiceReminderTemplate.updateMany(
          {
            companyId,
            templateType: template.templateType,
            _id: { $ne: templateId },
            isActive: true
          },
          { isActive: false }
        );
      }

      template.name = input.name ?? template.name;
      template.subject = input.subject ?? template.subject;
      template.htmlContent = input.htmlContent ?? template.htmlContent;
      template.isActive = input.isActive ?? template.isActive;
      template.daysBeforeDue = input.daysBeforeDue ?? template.daysBeforeDue;
      template.daysAfterDue = input.daysAfterDue ?? template.daysAfterDue;
      template.frequency = input.frequency ?? template.frequency;
      template.customIntervalDays = input.customIntervalDays ?? template.customIntervalDays;
      template.maxReminders = input.maxReminders ?? template.maxReminders;
      template.sendTime = input.sendTime ?? template.sendTime;
      template.updatedBy = input.userId;

      await template.save();
      return { success: true, data: template };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update template' };
    }
  }

  /**
   * Delete template (soft delete)
   */
  static async deleteTemplate(templateId: Types.ObjectId, companyId: Types.ObjectId) {
    try {
      const template = await InvoiceReminderTemplate.findOne({
        _id: templateId,
        companyId
      });

      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      await template.deleteOne();
      return { success: true, message: 'Template deleted successfully' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to delete template' };
    }
  }

  /**
   * Set template as active (deactivates others of same type)
   */
  static async setActiveTemplate(templateId: Types.ObjectId, companyId: Types.ObjectId, userId: Types.ObjectId) {
    try {
      const template = await InvoiceReminderTemplate.findOne({
        _id: templateId,
        companyId
      });

      if (!template) {
        return { success: false, message: 'Template not found' };
      }

      // Deactivate all other templates of the same type
      await InvoiceReminderTemplate.updateMany(
        {
          companyId,
          templateType: template.templateType,
          _id: { $ne: templateId }
        },
        { isActive: false }
      );

      // Activate this template
      template.isActive = true;
      template.updatedBy = userId;
      await template.save();

      return { success: true, data: template };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to set active template' };
    }
  }

  /**
   * Duplicate template
   */
  static async duplicateTemplate(templateId: Types.ObjectId, companyId: Types.ObjectId, userId: Types.ObjectId) {
    try {
      const originalTemplate = await InvoiceReminderTemplate.findOne({
        _id: templateId,
        companyId
      });

      if (!originalTemplate) {
        return { success: false, message: 'Template not found' };
      }

      const duplicatedTemplate = new InvoiceReminderTemplate({
        templateType: originalTemplate.templateType,
        name: `${originalTemplate.name} (Copy)`,
        subject: originalTemplate.subject,
        htmlContent: originalTemplate.htmlContent,
        isActive: false, // Duplicated templates are inactive by default
        daysBeforeDue: originalTemplate.daysBeforeDue,
        daysAfterDue: originalTemplate.daysAfterDue,
        frequency: originalTemplate.frequency,
        customIntervalDays: originalTemplate.customIntervalDays,
        maxReminders: originalTemplate.maxReminders,
        sendTime: originalTemplate.sendTime,
        companyId,
        ownerAdminId: originalTemplate.ownerAdminId,
        createdBy: userId,
        updatedBy: userId
      });

      await duplicatedTemplate.save();
      return { success: true, data: duplicatedTemplate };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to duplicate template' };
    }
  }
}