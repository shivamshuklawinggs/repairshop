import express from 'express';
import {
  initializeDefaultTemplates,
  createTemplate,
  getTemplates,
  getActiveTemplateByType,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  setActiveTemplate,
  duplicateTemplate
} from './invoiceReminderTemplate.controller';
import {
  invoiceReminderTemplateSchema,
  updateInvoiceReminderTemplateSchema
} from './invoiceReminderTemplate.validate';
import { Middleware } from 'middlewares/index';

const { requirePermission, verifyToken, requestValidate } = Middleware;
const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @route POST /api/invoice-reminder-templates/initialize
 * @desc Initialize default templates for a company
 * @access Private (Admin, Accountant)
 */
router.post('/initialize', requirePermission('create', ['accounting']), initializeDefaultTemplates);

/**
 * @route POST /api/invoice-reminder-templates
 * @desc Create a new template
 * @access Private (Admin, Accountant)
 */
router.post('/', requirePermission('create', ['accounting']), requestValidate(invoiceReminderTemplateSchema), createTemplate);

/**
 * @route GET /api/invoice-reminder-templates
 * @desc Get all templates for a company
 * @access Private (Admin, Accountant)
 */
router.get('/', requirePermission('view', ['accounting']), getTemplates);

/**
 * @route GET /api/invoice-reminder-templates/active/:type
 * @desc Get active template by type
 * @access Private (Admin, Accountant)
 */
router.get('/active/:type', requirePermission('view', ['accounting']), getActiveTemplateByType);

/**
 * @route GET /api/invoice-reminder-templates/:id
 * @desc Get template by ID
 * @access Private (Admin, Accountant)
 */
router.get('/:id', requirePermission('view', ['accounting']), getTemplateById);

/**
 * @route PUT /api/invoice-reminder-templates/:id
 * @desc Update template
 * @access Private (Admin, Accountant)
 */
router.put('/:id', requirePermission('update', ['accounting']), requestValidate(updateInvoiceReminderTemplateSchema), updateTemplate);

/**
 * @route DELETE /api/invoice-reminder-templates/:id
 * @desc Delete template
 * @access Private (Admin, Accountant)
 */
router.delete('/:id', requirePermission('delete', ['accounting']), deleteTemplate);

/**
 * @route PUT /api/invoice-reminder-templates/:id/set-active
 * @desc Set template as active
 * @access Private (Admin, Accountant)
 */
router.put('/:id/set-active', requirePermission('update', ['accounting']), setActiveTemplate);

/**
 * @route POST /api/invoice-reminder-templates/:id/duplicate
 * @desc Duplicate template
 * @access Private (Admin, Accountant)
 */
router.post('/:id/duplicate', requirePermission('create', ['accounting']), duplicateTemplate);

export default router;