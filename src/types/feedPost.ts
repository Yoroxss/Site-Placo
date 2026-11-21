export type FeedMediaType = 'image' | 'video' | 'none';
export type FeedCtaType = 'learn_more' | 'call' | 'quote' | 'none';

export interface FeedPost {
  id: string;
  content: string;
  category: string;
  location?: string;
  mediaType: FeedMediaType;
  mediaUrl?: string;
  videoPosterUrl?: string;
  dateLabel: string;
  publishedAt: string;
  ctaType: FeedCtaType;
  ctaUrl?: string;
  sourceTag?: string;
}
