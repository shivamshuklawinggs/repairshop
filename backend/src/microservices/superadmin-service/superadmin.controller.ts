import { Request, Response, NextFunction } from "express";
import {
  getSystemStats,
  getBusinessAnalytics,
} from "./superadmin.service";
import ProjectoverviewData from "./freightbooks-data.json";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
} from "docx";

/**
 * @description Get Business Analytics
 * @type GET 
 * @path /api/superadmin/analytics
 */
export const getAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const analytics = await getBusinessAnalytics(
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      data: analytics.data,
      success: true,
      message: "Business analytics retrieved successfully",
      statusCode: 200,
      pagination: analytics.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Get System Statistics
 * @type GET 
 * @path /api/superadmin/stats
 */
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId } = req.query;
    
    const stats = await getSystemStats(
      companyId ? String(companyId) : undefined
    );

    res.status(200).json({
      data: stats,
      success: true,
      message: "System statistics retrieved successfully",
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};
export const generateProjectDoc = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = ProjectoverviewData;

    const section: Paragraph[] = [];

    section.push(
      new Paragraph({
        text: `${data.project.name} — Project Overview`,
        heading: HeadingLevel.TITLE,
      }),
      new Paragraph({
        text: `${data.project.tagline} — ${data.project.description}`,
      }),
      new Paragraph({ text: " " })
    );

    section.push(
      new Paragraph({
        text: "Project",
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph(`Version: ${data.project.version}`),
      new Paragraph(`Status: ${data.project.status}`),
      new Paragraph({ text: " " })
    );

   

    section.push(
      new Paragraph({
        text: "Architecture",
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({ text: data.architecture.frontend.name, heading: HeadingLevel.HEADING_2 }),
      ...data.architecture.frontend.technologies.map(
        (item: string) => new Paragraph({ text: item, bullet: { level: 0 } })
      ),
      new Paragraph({ text: data.architecture.backend.name, heading: HeadingLevel.HEADING_2 }),
      ...data.architecture.backend.technologies.map(
        (item: string) => new Paragraph({ text: item, bullet: { level: 0 } })
      ),
      new Paragraph({ text: data.architecture.database.name, heading: HeadingLevel.HEADING_2 }),
      ...data.architecture.database.features.map(
        (item: string) => new Paragraph({ text: item, bullet: { level: 0 } })
      ),
      new Paragraph({ text: " " })
    );

    section.push(
      new Paragraph({
        text: "Roles & Permissions",
        heading: HeadingLevel.HEADING_1,
      }),
      ...data.roles.flatMap((role: any) => [
        new Paragraph({ text: `${role.name} (${role.level})`, heading: HeadingLevel.HEADING_2 }),
        new Paragraph(`Access: ${role.access}`),
        new Paragraph({ text: "Responsibilities:", bullet: { level: 0 } }),
        ...role.responsibilities.map(
          (resp: string) => new Paragraph({ text: resp, bullet: { level: 1 } })
        ),
        ...(role.canCreate?.length
          ? [
              new Paragraph({ text: "Can create:", bullet: { level: 0 } }),
              ...role.canCreate.map(
                (item: string) => new Paragraph({ text: item, bullet: { level: 1 } })
              ),
            ]
          : []),
        new Paragraph({ text: " " }),
      ])
    );

    

    const doc = new Document({ sections: [{ children: section }] });
    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${data.project.name}-overview.docx"`
    );

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};




