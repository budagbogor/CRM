export type InsightConfidence = "LOW" | "MEDIUM" | "HIGH";

export type CustomerInsight = {
  customerId: string;
  customerName: string;
  churnRiskScore: number;
  churnRiskReason: string;
  nextBestAction: string;
  recommendedReminderChannel: string;
  suggestedServiceCampaign: string;
  complaintRiskFlag: boolean;
  confidence: InsightConfidence;
  sourceData: string[];
};

export type ComplaintInsight = {
  complaintId: string;
  summary: string;
  recommendedAction: string;
  confidence: InsightConfidence;
  sourceData: string[];
};

export type CampaignRecommendation = {
  customerId: string;
  campaignName: string;
  reason: string;
  confidence: InsightConfidence;
  sourceData: string[];
};

export interface AiInsightProvider {
  generateCustomerInsight(customerId: string): Promise<CustomerInsight>;
  generateComplaintSummary(complaintId: string): Promise<ComplaintInsight>;
  suggestNextBestAction(customerId: string): Promise<string>;
  generateCampaignRecommendation(customerId: string): Promise<CampaignRecommendation>;
}

