import { defineEventHandler } from "h3";
import { articles } from "../../../data/articles";
import type { ArticleSummary } from "../../../../shared/types/content";

export default defineEventHandler((): { data: ArticleSummary[] } => ({
  data: articles.map(({ sections: _sections, ...summary }) => summary),
}));
