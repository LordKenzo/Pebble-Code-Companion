import type { Lang } from "./i18n";
import { buildReviewMessage } from "./context";
import { estimateCost, type Price } from "./cost";
import { Review, type ExperienceLevel, type FileUnderReview, type ReviewResult } from "./model";
import { applyPolicy } from "./policy";
import type { MentorModel, ProjectStore } from "./ports";

/** Caso d'uso: rivedere un file rispetto alle decisioni del progetto. */
export async function reviewFile(
  model: MentorModel,
  store: ProjectStore,
  systemPrompt: string,
  file: FileUnderReview,
  level: ExperienceLevel,
  price: Price | undefined,
  lang: Lang = "it",
): Promise<ReviewResult> {
  const ctx = await store.load();
  const { data: raw, usage } = await model.generate(systemPrompt, buildReviewMessage(ctx, file, level, lang), Review, "review");
  const { review, violations } = applyPolicy(raw);
  return {
    review,
    violations,
    provider: model.provider,
    model: model.model,
    level,
    usage,
    costUsd: estimateCost(usage, price),
  };
}
