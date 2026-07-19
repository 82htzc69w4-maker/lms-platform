import type { Competency, CompetencyLink, CompetencyStatus } from './types';

/**
 * Auto-calculates a competency's status from its linked evidence (courses,
 * assessments, observations, coaching sessions, practical tasks).
 *
 * Rules:
 * - No links yet -> not_competent
 * - Most recent link is a fail -> not_competent
 * - Two or more fails in the last 3 links (regardless of most recent) -> needs_refresher
 * - Most recent link is a pass:
 *     - If the competency is a certification with expiresAfterMonths, compute expiresOn.
 *       If that date has already passed -> expired
 *       Otherwise -> competent
 *     - If it's a skill (no expiry) -> competent
 * - 'pending' links are ignored when picking the "most recent" result, since a
 *   pending assessment doesn't yet tell us anything about competence.
 */
export function evaluateCompetency(
  competency: Competency,
  links: CompetencyLink[],
  now: Date = new Date()
): Omit<CompetencyStatus, 'overriddenBy' | 'overrideReason'> {
  const relevant = links
    .filter((l) => l.competencyId === competency.id && l.result !== 'pending')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lastEvaluated = now.toISOString();

  if (relevant.length === 0) {
    return {
      competencyId: competency.id,
      status: 'not_competent',
      autoCalculated: true,
      lastEvaluated,
    };
  }

  const mostRecent = relevant[0];
  const recentFailCount = relevant.slice(0, 3).filter((l) => l.result === 'fail').length;

  if (mostRecent.result === 'fail') {
    return {
      competencyId: competency.id,
      status: 'not_competent',
      autoCalculated: true,
      lastEvaluated,
    };
  }

  if (recentFailCount >= 2) {
    return {
      competencyId: competency.id,
      status: 'needs_refresher',
      autoCalculated: true,
      lastEvaluated,
    };
  }

  // mostRecent.result === 'pass' from here on
  if (competency.type === 'certification' && competency.expiresAfterMonths) {
    const passDate = new Date(mostRecent.date);
    const expiresOn = new Date(passDate);
    expiresOn.setMonth(expiresOn.getMonth() + competency.expiresAfterMonths);

    if (expiresOn.getTime() <= now.getTime()) {
      return {
        competencyId: competency.id,
        status: 'expired',
        autoCalculated: true,
        lastEvaluated,
        expiresOn: expiresOn.toISOString(),
      };
    }

    return {
      competencyId: competency.id,
      status: 'competent',
      autoCalculated: true,
      lastEvaluated,
      expiresOn: expiresOn.toISOString(),
    };
  }

  return {
    competencyId: competency.id,
    status: 'competent',
    autoCalculated: true,
    lastEvaluated,
  };
}
