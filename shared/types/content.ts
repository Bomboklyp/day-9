export interface ArticleSection {
  title: string;
  text: string;
}
export interface PublicArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryId: string;
  updatedAt: string;
  minutes: number;
  sections: ArticleSection[];
}
export type ArticleSummary = Omit<PublicArticle, "sections">;
export interface HelpCategory {
  id: string;
  title: string;
  description: string;
}
