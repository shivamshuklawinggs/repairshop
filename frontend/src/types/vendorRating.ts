export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface IVendorCommunicationMetrics {
  averageResponseMinutes: number;
  proactiveUpdateRatio: number;
  unansweredContacts: number;
}

export interface IVendorBehaviorMetrics {
  complianceIncidents: number;
  scheduleDeviationRate: number;
  positiveFeedback: number;
  negativeFeedback: number;
}

export interface IVendorBusinessStabilityMetrics {
  tenureMonths: number;
  activeMonthsLastYear: number;
}

export interface IVendorPerformanceMetrics {
  onTimePickupRate: number;
  onTimeDeliveryRate: number;
  damageRate: number;
  avgClaimResolutionDays: number;
}

export interface IVendorIncidentMetrics {
  incidentCounts: Record<string, number>;
}

export interface IVendorRatingMetrics {
  communication: IVendorCommunicationMetrics;
  behavior: IVendorBehaviorMetrics;
  businessStability: IVendorBusinessStabilityMetrics;
  performance: IVendorPerformanceMetrics;
  incidents: IVendorIncidentMetrics;
}

export interface IVendorRatingScoreDetail<TMetrics> {
  score: number;
  grade: LetterGrade;
  metrics: TMetrics;
}

export interface IVendorRatingScoreBreakdown {
  communication: IVendorRatingScoreDetail<IVendorCommunicationMetrics>;
  behavior: IVendorRatingScoreDetail<IVendorBehaviorMetrics>;
  businessStability: IVendorRatingScoreDetail<IVendorBusinessStabilityMetrics>;
  performance: IVendorRatingScoreDetail<IVendorPerformanceMetrics>;
  incidents: IVendorRatingScoreDetail<IVendorIncidentMetrics>;
}

export interface IVendorRatingReport {
  incidentDate: string;
  reportedDate: string;
  reportType: string;
  description: string;
  attachments?: string[];
  carrierResponse?: string;
  severity?: 'minor' | 'major' | 'critical';
}

export interface IVendorRating {
  _id?: string;
  loadId: string;
  companyId: string;
  communicationGrade: LetterGrade;
  behaviorGrade: LetterGrade;
  businessStabilityGrade: LetterGrade;
  performanceGrade: LetterGrade;
  incidentGrade: LetterGrade;
  overallScore: number;
  letterGrade: LetterGrade;
  businessAge: {
    years: number;
    months: number;
  };
  metrics: IVendorRatingMetrics;
  scoreBreakdown: IVendorRatingScoreBreakdown;
  reports: IVendorRatingReport[];
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IVendorRatingPayload {
  metrics: Partial<IVendorRatingMetrics>;
  reports?: IVendorRatingReport[];
  businessAge?: {
    years: number;
    months: number;
  };
}
