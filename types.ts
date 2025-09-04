export type Language = 'es' | 'pt';

export interface Translations {
  [key: string]: string;
}

export interface Localization {
  es: Translations;
  pt: Translations;
}

export interface FeedbackData {
  csatService: number;
  csatDelivery: number;
  csatPlatform: number;
  whyUs: string;
  nps: number;
  whatBetter: string;
  wowIdeas: string;
  date: string;
}

export interface Metrics {
  nps: {
    score: number;
    promoters: number;
    passives: number;
    detractors: number;
    total: number;
  };
  csat: {
    service: number;
    delivery: number;
    platform: number;
  };
}

export interface SentimentAnalysisResult {
  positive: number;
  neutral: number;

  negative: number;
}

export interface Suggestion {
  originalComment: string;
  suggestion: string;
}

export interface PositiveHighlight {
  positiveComment: string;
  npsScore: number;
  reason: string;
}
