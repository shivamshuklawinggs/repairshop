import * as yup from 'yup';

export const invoiceReminderTemplateSchema = yup.object().shape({
  templateType: yup
    .string()
    .oneOf(['before', 'after', 'on_due'], 'Template type must be one of: before, after, on_due')
    .required('Template type is required'),
  name: yup
    .string()
    .required('Template name is required')
    .min(2, 'Template name must be at least 2 characters')
    .max(100, 'Template name must not exceed 100 characters')
    .trim(),
  subject: yup
    .string()
    .required('Subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must not exceed 200 characters')
    .trim(),
  htmlContent: yup
    .string()
    .required('HTML content is required')
    .test('is-html', 'HTML content must contain valid HTML', (value) => {
      if (!value) return false;
      return value.includes('<') && value.includes('>');
    }),
  isActive: yup.boolean().default(true),
  // Scheduling configuration
  daysBeforeDue: yup
    .number()
    .min(1, 'Days before due must be at least 1')
    .max(365, 'Days before due must not exceed 365')
    .optional()
    .default(7),
  daysAfterDue: yup
    .number()
    .min(1, 'Days after due must be at least 1')
    .max(365, 'Days after due must not exceed 365')
    .optional()
    .default(1),
  frequency: yup
    .string()
    .oneOf(['once', 'daily', 'weekly', 'custom'], 'Frequency must be one of: once, daily, weekly, custom')
    .required('Frequency is required')
    .default('once'),
  customIntervalDays: yup
    .number()
    .min(1, 'Custom interval days must be at least 1')
    .max(365, 'Custom interval days must not exceed 365')
    .optional()
    .default(1),
  maxReminders: yup
    .number()
    .min(1, 'Max reminders must be at least 1')
    .max(50, 'Max reminders must not exceed 50')
    .optional()
    .default(5),
  sendTime: yup
    .string()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Send time must be in HH:MM format')
    .required('Send time is required')
    .default('09:00'),
});

export const updateInvoiceReminderTemplateSchema = yup.object().shape({
  name: yup
    .string()
    .min(2, 'Template name must be at least 2 characters')
    .max(100, 'Template name must not exceed 100 characters')
    .trim()
    .optional(),
  subject: yup
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must not exceed 200 characters')
    .trim()
    .optional(),
  htmlContent: yup
    .string()
    .test('is-html', 'HTML content must contain valid HTML', (value) => {
      if (!value) return true; // Allow optional updates
      return value.includes('<') && value.includes('>');
    })
    .optional(),
  isActive: yup.boolean().optional(),
  // Scheduling configuration
  daysBeforeDue: yup
    .number()
    .min(1, 'Days before due must be at least 1')
    .max(365, 'Days before due must not exceed 365')
    .optional(),
  daysAfterDue: yup
    .number()
    .min(1, 'Days after due must be at least 1')
    .max(365, 'Days after due must not exceed 365')
    .optional(),
  frequency: yup
    .string()
    .oneOf(['once', 'daily', 'weekly', 'custom'], 'Frequency must be one of: once, daily, weekly, custom')
    .optional(),
  customIntervalDays: yup
    .number()
    .min(1, 'Custom interval days must be at least 1')
    .max(365, 'Custom interval days must not exceed 365')
    .optional(),
  maxReminders: yup
    .number()
    .min(1, 'Max reminders must be at least 1')
    .max(50, 'Max reminders must not exceed 50')
    .optional(),
  sendTime: yup
    .string()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Send time must be in HH:MM format')
    .optional(),
});

type InvoiceReminderTemplateSchema = yup.InferType<typeof invoiceReminderTemplateSchema>;
type UpdateInvoiceReminderTemplateSchema = yup.InferType<typeof updateInvoiceReminderTemplateSchema>;

export { InvoiceReminderTemplateSchema, UpdateInvoiceReminderTemplateSchema };