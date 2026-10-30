/**
 * Pure helper utilities for referral codes, validation, and reward tiers.
 */

export interface RewardTier {
  id: string;
  requiredReferrals: number;
  title: string;
  perks: string;
  isLifetime?: boolean;
}

export const REWARD_TIERS: RewardTier[] = [
  {
    id: 'tier-3',
    requiredReferrals: 3,
    title: 'Founding Member badge + 1 month free',
    perks: 'Permanent Founding Member profile badge and 30 days of complimentary access at launch.',
  },
  {
    id: 'tier-5',
    requiredReferrals: 5,
    title: '3 months free',
    perks: 'Full 90 days of automated client-ops workflows at zero cost.',
  },
  {
    id: 'tier-10',
    requiredReferrals: 10,
    title: '6 months free + founding-member pricing locked in',
    perks: 'Half a year free, plus permanent price-lock for all future billing cycles.',
  },
  {
    id: 'tier-top3',
    requiredReferrals: 999, // Leaderboard position based
    title: 'Top 3 on the leaderboard: lifetime access',
    perks: 'Lifetime access to ClientFlow for the lifetime of the product (limited to 3 people, subject to fair use).',
    isLifetime: true,
  },
];

/**
 * Validates email format.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  // Standard robust email pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Normalizes email for comparisons and deduplication.
 */
export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Generates an 8-character unique alphanumeric referral code.
 */
export function generateReferralCode(name?: string): string {
  const prefix = name
    ? name
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 4)
    : '';

  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous chars like 0, O, 1, I
  let randomPart = '';
  const neededLength = 8 - prefix.length;
  for (let i = 0; i < (neededLength > 4 ? neededLength : 4); i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return (prefix + randomPart).slice(0, 8);
}

/**
 * Checks if a referral attempt is a self-referral or invalid duplicate.
 */
export function isSelfReferral(
  referrerCode: string | null | undefined,
  currentUserCode: string | null | undefined,
  referrerEmail: string | null | undefined,
  candidateEmail: string
): boolean {
  if (!referrerCode) return false;
  if (currentUserCode && referrerCode.toUpperCase() === currentUserCode.toUpperCase()) {
    return true;
  }
  if (referrerEmail && normalizeEmail(referrerEmail) === normalizeEmail(candidateEmail)) {
    return true;
  }
  return false;
}

/**
 * Returns the current achieved tier and the next milestone target.
 */
export function getTierProgress(confirmedReferrals: number) {
  const count = Math.max(0, confirmedReferrals);

  if (count < 3) {
    return {
      currentTier: null,
      nextTier: REWARD_TIERS[0],
      neededForNext: 3 - count,
      progressPercent: Math.round((count / 3) * 100),
      currentCount: count,
      nextTarget: 3,
    };
  } else if (count < 5) {
    return {
      currentTier: REWARD_TIERS[0],
      nextTier: REWARD_TIERS[1],
      neededForNext: 5 - count,
      progressPercent: Math.round(((count - 3) / (5 - 3)) * 100),
      currentCount: count,
      nextTarget: 5,
    };
  } else if (count < 10) {
    return {
      currentTier: REWARD_TIERS[1],
      nextTier: REWARD_TIERS[2],
      neededForNext: 10 - count,
      progressPercent: Math.round(((count - 5) / (10 - 5)) * 100),
      currentCount: count,
      nextTarget: 10,
    };
  } else {
    return {
      currentTier: REWARD_TIERS[2],
      nextTier: REWARD_TIERS[3],
      neededForNext: 0,
      progressPercent: 100,
      currentCount: count,
      nextTarget: 10,
    };
  }
}

/**
 * Formats full referral URL given a code.
 */
export function buildReferralUrl(baseUrl: string, code: string): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('ref', code);
    return url.toString();
  } catch {
    return `${baseUrl.split('?')[0]}?ref=${code}`;
  }
}
