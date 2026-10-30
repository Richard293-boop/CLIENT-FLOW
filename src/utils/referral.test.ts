import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  normalizeEmail,
  generateReferralCode,
  isSelfReferral,
  getTierProgress,
  REWARD_TIERS,
} from './referral';

test('validateEmail validates typical and edge case emails correctly', () => {
  assert.equal(validateEmail('freelancer@example.com'), true);
  assert.equal(validateEmail('sarah.design@agency.co.uk'), true);
  assert.equal(validateEmail('invalid-email'), false);
  assert.equal(validateEmail(''), false);
  assert.equal(validateEmail('missing@domain'), false);
  assert.equal(validateEmail('spaces @example.com'), false);
});

test('normalizeEmail lowercases and trims', () => {
  assert.equal(normalizeEmail('  User@Domain.COM  '), 'user@domain.com');
});

test('generateReferralCode returns valid non-empty codes with optional prefix', () => {
  const codeWithName = generateReferralCode('Maya');
  assert.equal(codeWithName.length, 8);
  assert.equal(codeWithName.startsWith('MAYA'), true);

  const codeWithoutName = generateReferralCode();
  assert.equal(codeWithoutName.length, 8);
});

test('isSelfReferral catches code match and email match', () => {
  assert.equal(isSelfReferral('CODE123', 'CODE123', null, 'test@example.com'), true);
  assert.equal(
    isSelfReferral('DIFF123', 'MINE456', 'alex@example.com', 'alex@example.com'),
    true
  );
  assert.equal(
    isSelfReferral('DIFF123', 'MINE456', 'alex@example.com', 'sam@example.com'),
    false
  );
  assert.equal(isSelfReferral(null, null, null, 'sam@example.com'), false);
});

test('getTierProgress returns correct tier steps and progress percentages', () => {
  // 0 referrals
  const p0 = getTierProgress(0);
  assert.equal(p0.currentTier, null);
  assert.equal(p0.nextTier.requiredReferrals, 3);
  assert.equal(p0.neededForNext, 3);
  assert.equal(p0.progressPercent, 0);

  // 2 referrals
  const p2 = getTierProgress(2);
  assert.equal(p2.currentTier, null);
  assert.equal(p2.neededForNext, 1);
  assert.equal(p2.progressPercent, 67);

  // 3 referrals (hit tier 1)
  const p3 = getTierProgress(3);
  assert.equal(p3.currentTier?.id, 'tier-3');
  assert.equal(p3.nextTier.requiredReferrals, 5);
  assert.equal(p3.neededForNext, 2);

  // 5 referrals (hit tier 2)
  const p5 = getTierProgress(5);
  assert.equal(p5.currentTier?.id, 'tier-5');
  assert.equal(p5.nextTier.requiredReferrals, 10);
  assert.equal(p5.neededForNext, 5);

  // 10 referrals (hit tier 3)
  const p10 = getTierProgress(10);
  assert.equal(p10.currentTier?.id, 'tier-10');
  assert.equal(p10.progressPercent, 100);
});

test('REWARD_TIERS strictly does not contain any call or booking promises', () => {
  for (const tier of REWARD_TIERS) {
    const text = `${tier.title} ${tier.perks}`.toLowerCase();
    assert.equal(text.includes('call'), false, 'Should not mention calls');
    assert.equal(text.includes('booking'), false, 'Should not mention booking');
  }
});
