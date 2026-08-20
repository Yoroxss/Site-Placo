export interface QuoteRequest {
  id?: string;
  name: string;
  phone: string;
  email: string;
  projectType: string;
  message: string;
  createdAt: string;
}

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutText1: string;
  aboutText2: string;
  updatedAt?: string;
}

export interface SeoConfig {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage?: string;
  aiAgentInstructions: string;
  faqs: { question: string; answer: string }[];
  faviconUrl?: string;
}
