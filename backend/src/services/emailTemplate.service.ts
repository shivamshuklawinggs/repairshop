import ejs from 'ejs';
import path from 'path';
import fs from 'fs';

export interface EmailTemplateData {
  billNumber?: string;
  invoiceNumber?: string;
  estimateNumber?: string;
  customerName?: string;
  issueDate?: string;
  invoiceDate?: string;
  estimateDate?: string;
  dueDate?: string;
  validUntil?: string;
  amount?: string;
  balanceDue?: string;
  acceptUrl?: string;
  [key: string]: any;
}

class EmailTemplateService {
  private static templateDir = path.join(__dirname, '../templates/emails');

  static async renderTemplate(templateName: 'bill' | 'invoice' | 'estimate', data: EmailTemplateData): Promise<string> {
    const templatePath = path.join(this.templateDir, `${templateName}.ejs`);
    
    try {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const renderedHtml = ejs.render(templateContent, data);
      return renderedHtml;
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error);
      // Fallback to simple HTML if template fails to render
      return this.getFallbackTemplate(templateName, data);
    }
  }

  private static getFallbackTemplate(templateName: string, data: EmailTemplateData): string {
    const title = templateName.charAt(0).toUpperCase() + templateName.slice(1);
    const documentNumber = data[`${templateName}Number`] || data.billNumber || 'N/A';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title} Notification</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #007bff; margin: 0; }
        .details { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title} Notification</h1>
        </div>
        
        <div class="details">
            <p><strong>${title} Number:</strong> ${documentNumber}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            ${data.amount ? `<p><strong>Amount:</strong> ${data.amount}</p>` : ''}
        </div>

        <p>Dear ${data.customerName || 'Valued Customer'},</p>
        
        <p>Please find your ${title} attached to this email.</p>
        
        <p>Thank you for your business!</p>

        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} FreightBooks. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }
}

export default EmailTemplateService;
