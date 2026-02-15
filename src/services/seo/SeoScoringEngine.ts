/**
 * SEO Scoring Engine v1.0
 * Deterministic, weighted scoring system for product SEO quality.
 * Pure functions — no DB dependency, fully testable.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface SeoInput {
  title: string;
  description: string;
  seo_title?: string | null;
  seo_description?: string | null;
  images: { url: string; alt?: string }[];
  tags: string[];
  sku?: string | null;
  category?: string | null;
  price?: number;
  url_slug?: string | null;
}

export type IssueSeverity = 'error' | 'warning' | 'info';
export type ImpactLevel = 'critical' | 'high' | 'medium' | 'low';

export interface SeoIssue {
  category: string;
  rule: string;
  message: string;
  severity: IssueSeverity;
  impact: ImpactLevel;
  current_value?: string | number;
  recommended_value?: string | number;
}

export interface SeoRecommendation {
  category: string;
  message: string;
  impact: ImpactLevel;
  effort: 'low' | 'medium' | 'high';
}

export interface SeoCategoryScore {
  score: number;        // 0-100
  weight: number;       // fraction
  weighted_score: number;
  issues: SeoIssue[];
  recommendations: SeoRecommendation[];
}

export interface SeoScoreResult {
  overall_score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'optimized' | 'needs_work' | 'critical';
  categories: {
    title: SeoCategoryScore;
    description: SeoCategoryScore;
    meta: SeoCategoryScore;
    images: SeoCategoryScore;
    structure: SeoCategoryScore;
  };
  issues: SeoIssue[];
  recommendations: SeoRecommendation[];
  scored_at: string;
}

// ── Weights ────────────────────────────────────────────────────────────

const CATEGORY_WEIGHTS = {
  title: 0.25,
  description: 0.25,
  meta: 0.20,
  images: 0.15,
  structure: 0.15,
} as const;

// ── Engine ──────────────────────────────────────────────────────────────

export function scoreSeo(input: SeoInput): SeoScoreResult {
  const title = scoreTitle(input);
  const description = scoreDescription(input);
  const meta = scoreMeta(input);
  const images = scoreImages(input);
  const structure = scoreStructure(input);

  const overall = Math.round(
    title.weighted_score + description.weighted_score +
    meta.weighted_score + images.weighted_score + structure.weighted_score
  );

  const allIssues = [...title.issues, ...description.issues, ...meta.issues, ...images.issues, ...structure.issues];
  const allRecs = [...title.recommendations, ...description.recommendations, ...meta.recommendations, ...images.recommendations, ...structure.recommendations];

  // Sort by impact
  const impactOrder: Record<ImpactLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  allIssues.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);
  allRecs.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  return {
    overall_score: overall,
    grade: getGrade(overall),
    status: overall >= 80 ? 'optimized' : overall >= 50 ? 'needs_work' : 'critical',
    categories: { title, description, meta, images, structure },
    issues: allIssues,
    recommendations: allRecs,
    scored_at: new Date().toISOString(),
  };
}

function getGrade(score: number): SeoScoreResult['grade'] {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function makeCategory(score: number, weight: number, issues: SeoIssue[], recommendations: SeoRecommendation[]): SeoCategoryScore {
  return { score: Math.min(100, Math.max(0, score)), weight, weighted_score: Math.round(Math.min(100, Math.max(0, score)) * weight), issues, recommendations };
}

// ── Title Scoring ──────────────────────────────────────────────────────

function scoreTitle(input: SeoInput): SeoCategoryScore {
  let score = 0;
  const issues: SeoIssue[] = [];
  const recs: SeoRecommendation[] = [];
  const t = input.title;

  if (!t || t.length === 0) {
    issues.push({ category: 'title', rule: 'title_missing', message: 'Titre manquant', severity: 'error', impact: 'critical' });
    return makeCategory(0, CATEGORY_WEIGHTS.title, issues, [{ category: 'title', message: 'Ajouter un titre produit descriptif de 20-70 caractères', impact: 'critical', effort: 'low' }]);
  }

  // Length check (20-70 optimal)
  if (t.length >= 20 && t.length <= 70) {
    score += 35;
  } else if (t.length < 20) {
    score += 10;
    issues.push({ category: 'title', rule: 'title_short', message: `Titre trop court (${t.length} car.)`, severity: 'warning', impact: 'high', current_value: t.length, recommended_value: '20-70' });
    recs.push({ category: 'title', message: 'Allonger le titre entre 20 et 70 caractères', impact: 'high', effort: 'low' });
  } else {
    score += 20;
    issues.push({ category: 'title', rule: 'title_long', message: `Titre trop long (${t.length} car.)`, severity: 'warning', impact: 'medium', current_value: t.length, recommended_value: 70 });
  }

  // Word count (>=3)
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 3) score += 25;
  else {
    score += 10;
    recs.push({ category: 'title', message: 'Utiliser au moins 3 mots descriptifs dans le titre', impact: 'high', effort: 'low' });
  }

  // Capitalization
  if (/^[A-ZÀ-Ü]/.test(t)) score += 10;

  // No spam patterns
  if (!/[!!!]{2,}|[A-Z]{10,}|(.)\1{4,}/.test(t)) score += 15;
  else issues.push({ category: 'title', rule: 'title_spam', message: 'Titre contient des patterns spammeux', severity: 'warning', impact: 'medium' });

  // No duplicate words
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  if (uniqueWords.size >= words.length * 0.7) score += 15;
  else issues.push({ category: 'title', rule: 'title_repetitive', message: 'Titre contient des mots répétitifs', severity: 'info', impact: 'low' });

  return makeCategory(score, CATEGORY_WEIGHTS.title, issues, recs);
}

// ── Description Scoring ────────────────────────────────────────────────

function scoreDescription(input: SeoInput): SeoCategoryScore {
  let score = 0;
  const issues: SeoIssue[] = [];
  const recs: SeoRecommendation[] = [];
  const d = (input.description || '').replace(/<[^>]*>/g, '').trim();

  if (!d) {
    issues.push({ category: 'description', rule: 'desc_missing', message: 'Description manquante', severity: 'error', impact: 'critical' });
    return makeCategory(0, CATEGORY_WEIGHTS.description, issues, [{ category: 'description', message: 'Ajouter une description détaillée de 150-500 caractères', impact: 'critical', effort: 'medium' }]);
  }

  // Length scoring
  if (d.length >= 150 && d.length <= 500) score += 35;
  else if (d.length >= 50) {
    score += 20;
    issues.push({ category: 'description', rule: 'desc_short', message: `Description courte (${d.length} car.)`, severity: 'warning', impact: 'high', current_value: d.length, recommended_value: '150-500' });
    recs.push({ category: 'description', message: 'Enrichir la description à 150-500 caractères', impact: 'high', effort: 'medium' });
  } else {
    score += 10;
    issues.push({ category: 'description', rule: 'desc_very_short', message: `Description très courte (${d.length} car.)`, severity: 'error', impact: 'critical', current_value: d.length });
  }

  // Word count
  const words = d.split(/\s+/).filter(Boolean);
  if (words.length >= 25) score += 20;
  else if (words.length >= 10) score += 10;

  // Sentence structure (has punctuation)
  if (/[.!?]/.test(d)) score += 15;
  else recs.push({ category: 'description', message: 'Structurer la description avec des phrases complètes', impact: 'medium', effort: 'low' });

  // Contains numbers (specs, dimensions)
  if (/\d/.test(d)) score += 10;

  // Unique content (not same as title)
  if (input.title && d.toLowerCase() !== input.title.toLowerCase()) score += 20;
  else issues.push({ category: 'description', rule: 'desc_same_as_title', message: 'Description identique au titre', severity: 'warning', impact: 'high' });

  return makeCategory(score, CATEGORY_WEIGHTS.description, issues, recs);
}

// ── Meta Scoring ───────────────────────────────────────────────────────

function scoreMeta(input: SeoInput): SeoCategoryScore {
  let score = 0;
  const issues: SeoIssue[] = [];
  const recs: SeoRecommendation[] = [];

  // SEO Title
  const st = input.seo_title;
  if (st && st.length >= 10) {
    score += 20;
    if (st.length <= 60) score += 15;
    else issues.push({ category: 'meta', rule: 'meta_title_long', message: `Meta titre trop long (${st.length} car.)`, severity: 'warning', impact: 'medium', recommended_value: 60 });
  } else {
    issues.push({ category: 'meta', rule: 'meta_title_missing', message: 'Meta titre manquant ou trop court', severity: 'warning', impact: 'high' });
    recs.push({ category: 'meta', message: 'Ajouter un meta titre unique de 30-60 caractères', impact: 'high', effort: 'low' });
  }

  // SEO Description
  const sd = input.seo_description;
  if (sd && sd.length >= 50) {
    score += 20;
    if (sd.length <= 160) score += 15;
    else issues.push({ category: 'meta', rule: 'meta_desc_long', message: `Meta description trop longue (${sd.length} car.)`, severity: 'info', impact: 'low', recommended_value: 160 });
  } else {
    issues.push({ category: 'meta', rule: 'meta_desc_missing', message: 'Meta description manquante', severity: 'warning', impact: 'high' });
    recs.push({ category: 'meta', message: 'Ajouter une meta description de 120-160 caractères', impact: 'high', effort: 'low' });
  }

  // Tags
  if (input.tags.length >= 5) score += 15;
  else if (input.tags.length >= 2) score += 8;
  else {
    recs.push({ category: 'meta', message: 'Ajouter 3-5 tags pertinents pour le référencement', impact: 'medium', effort: 'low' });
  }

  // Category
  if (input.category && input.category !== 'Non catégorisé') score += 15;
  else recs.push({ category: 'meta', message: 'Assigner une catégorie au produit', impact: 'medium', effort: 'low' });

  return makeCategory(score, CATEGORY_WEIGHTS.meta, issues, recs);
}

// ── Images Scoring ─────────────────────────────────────────────────────

function scoreImages(input: SeoInput): SeoCategoryScore {
  let score = 0;
  const issues: SeoIssue[] = [];
  const recs: SeoRecommendation[] = [];
  const imgs = input.images || [];

  if (imgs.length === 0) {
    issues.push({ category: 'images', rule: 'no_images', message: 'Aucune image produit', severity: 'error', impact: 'critical' });
    return makeCategory(0, CATEGORY_WEIGHTS.images, issues, [{ category: 'images', message: 'Ajouter au minimum 3 images produit haute qualité', impact: 'critical', effort: 'medium' }]);
  }

  // Count scoring
  if (imgs.length >= 5) score += 40;
  else if (imgs.length >= 3) score += 30;
  else { score += 15; recs.push({ category: 'images', message: `Ajouter plus d'images (${imgs.length}/3 minimum)`, impact: 'high', effort: 'medium' }); }

  // Alt text
  const withAlt = imgs.filter(i => i.alt && i.alt.trim().length > 0);
  const altRatio = withAlt.length / imgs.length;
  score += Math.round(altRatio * 35);
  if (altRatio < 1) {
    issues.push({ category: 'images', rule: 'missing_alt', message: `${imgs.length - withAlt.length} image(s) sans texte alternatif`, severity: 'warning', impact: 'high', current_value: withAlt.length, recommended_value: imgs.length });
    recs.push({ category: 'images', message: 'Ajouter un texte alt descriptif à toutes les images', impact: 'high', effort: 'low' });
  }

  // URL quality (no broken patterns)
  const validUrls = imgs.filter(i => {
    try { new URL(i.url); return true; } catch { return false; }
  });
  score += Math.round((validUrls.length / imgs.length) * 25);

  return makeCategory(score, CATEGORY_WEIGHTS.images, issues, recs);
}

// ── Structure Scoring ──────────────────────────────────────────────────

function scoreStructure(input: SeoInput): SeoCategoryScore {
  let score = 0;
  const issues: SeoIssue[] = [];
  const recs: SeoRecommendation[] = [];

  // SKU
  if (input.sku) score += 25;
  else recs.push({ category: 'structure', message: 'Ajouter un SKU unique pour le suivi', impact: 'medium', effort: 'low' });

  // Price
  if (input.price && input.price > 0) score += 25;
  else issues.push({ category: 'structure', rule: 'no_price', message: 'Prix non défini', severity: 'error', impact: 'critical' });

  // Category
  if (input.category && input.category !== 'Non catégorisé') score += 25;

  // URL slug
  if (input.url_slug) score += 15;
  else recs.push({ category: 'structure', message: 'Définir un slug URL optimisé pour le SEO', impact: 'medium', effort: 'low' });

  // Tags
  if (input.tags.length > 0) score += 10;

  return makeCategory(score, CATEGORY_WEIGHTS.structure, issues, recs);
}

/**
 * Score multiple products and aggregate stats.
 */
export function scoreBatch(inputs: SeoInput[]): {
  results: SeoScoreResult[];
  stats: { avg_score: number; by_grade: Record<string, number>; top_issues: { rule: string; count: number }[] };
} {
  const results = inputs.map(scoreSeo);
  const avg = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.overall_score, 0) / results.length)
    : 0;

  const byGrade: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  const issueCount = new Map<string, number>();

  for (const r of results) {
    byGrade[r.grade] = (byGrade[r.grade] || 0) + 1;
    for (const issue of r.issues) {
      issueCount.set(issue.rule, (issueCount.get(issue.rule) || 0) + 1);
    }
  }

  const topIssues = [...issueCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([rule, count]) => ({ rule, count }));

  return { results, stats: { avg_score: avg, by_grade: byGrade, top_issues: topIssues } };
}
