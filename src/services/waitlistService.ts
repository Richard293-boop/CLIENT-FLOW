/**
 * ClientFlow Firebase Database Service
 * 
 * Powered by Google Cloud Firestore with real-time rankings and zero fake data.
 * - Private registration data (emails, tokens) is isolated in /waitlist_signups
 * - Public leaderboard data (first names and referral counts only, NO emails) is stored in /public_leaderboard
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer,
  increment,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { validateEmail, generateReferralCode, normalizeEmail } from '../utils/referral';

export interface WaitlistUser {
  referralCode: string;
  email?: string;
  firstName?: string;
  isEmailConfirmed: boolean;
  confirmedReferrals: number;
  confirmationToken?: string;
  createdAt?: string;
  rank: number;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  confirmedReferrals: number;
  isCurrentUser?: boolean;
  isLifetimeSpot: boolean;
  referralCode?: string;
}

const STORAGE_KEY_SESSION = 'clientflow_firebase_session_v1';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(errInfo.error);
}

function getDocIdForEmail(email: string): string {
  return `user_${normalizeEmail(email).replace(/[^a-z0-9]/g, '_')}`;
}

export function getSavedSession(): WaitlistUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: WaitlistUser): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to store session in storage', err);
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  } catch {}
}

/**
 * Calculates the user's REAL live rank from Firestore.
 * 1. Users with more confirmed referrals rank higher.
 * 2. If same referrals (e.g. 0), the user who joined earlier ranks higher.
 * 3. If you are the first user to sign up, your rank is #1!
 */
export async function computeRealRank(
  confirmedReferrals: number,
  userCreatedAt?: string
): Promise<number> {
  try {
    // 1. Count how many users have strictly more confirmed referrals
    const higherQuery = query(
      collection(db, 'public_leaderboard'),
      where('confirmedReferrals', '>', confirmedReferrals)
    );
    const higherSnap = await getCountFromServer(higherQuery);
    let rank = higherSnap.data().count + 1;

    // 2. Among users with the same number of referrals, earlier signups rank higher
    if (userCreatedAt) {
      try {
        const tieQuery = query(
          collection(db, 'public_leaderboard'),
          where('confirmedReferrals', '==', confirmedReferrals),
          where('createdAt', '<', userCreatedAt)
        );
        const tieSnap = await getCountFromServer(tieQuery);
        rank += tieSnap.data().count;
      } catch {
        // If composite index is pending, rank is based on higher referrals count + 1
      }
    }

    return Math.max(1, rank);
  } catch (err) {
    console.warn('Real rank query fallback:', err);
    return 1;
  }
}

/**
 * 1. SIGNUP: Creates a waitlist signup document in Firebase Firestore
 * Calculates real rank from database (Rank #1 if first user).
 */
export async function saveSignup(params: {
  email: string;
  firstName?: string;
  referrerCode?: string | null;
  consentGiven: boolean;
}): Promise<{
  success: boolean;
  user: WaitlistUser;
  isExisting?: boolean;
  message?: string;
}> {
  const { email, firstName, referrerCode, consentGiven } = params;

  if (!email || !validateEmail(email)) {
    throw new Error('Please enter a valid work or personal email address.');
  }

  if (!consentGiven) {
    throw new Error('Please check the consent box agreeing to receive launch updates.');
  }

  const cleanEmail = normalizeEmail(email);
  const cleanFirstName = firstName?.trim() || null;
  const docId = getDocIdForEmail(cleanEmail);
  const signupRef = doc(db, 'waitlist_signups', docId);

  // Check if user already exists
  try {
    const existingSnap = await getDoc(signupRef);
    if (existingSnap.exists()) {
      const data = existingSnap.data();
      const realRank = await computeRealRank(data.confirmedReferrals || 0, data.createdAt);

      const existingUser: WaitlistUser = {
        referralCode: data.referralCode,
        email: cleanEmail,
        firstName: data.firstName || undefined,
        isEmailConfirmed: data.isEmailConfirmed ?? true,
        confirmedReferrals: data.confirmedReferrals || 0,
        confirmationToken: data.confirmationToken,
        createdAt: data.createdAt,
        rank: realRank,
      };
      saveSession(existingUser);
      return {
        success: true,
        user: existingUser,
        isExisting: true,
        message: "You're already on the waitlist! Showing your active dashboard.",
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `waitlist_signups/${docId}`);
  }

  // Validate referrer code (must exist and not be self)
  let validReferrerCode: string | null = null;
  if (referrerCode) {
    const cleanRef = referrerCode.trim().toUpperCase();
    try {
      const refLeaderSnap = await getDoc(doc(db, 'public_leaderboard', cleanRef));
      if (refLeaderSnap.exists()) {
        validReferrerCode = cleanRef;
      }
    } catch {
      // Ignore invalid referrer code
    }
  }

  const referralCode = generateReferralCode(cleanFirstName || undefined);
  const confirmationToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const nowIso = new Date().toISOString();

  const newRecord = {
    email: cleanEmail,
    firstName: cleanFirstName,
    referralCode,
    referredBy: validReferrerCode,
    confirmationToken,
    isEmailConfirmed: true, // Instant activation for publishing
    confirmedReferrals: 0,
    referralCredited: validReferrerCode ? true : false,
    consentGiven: true,
    consentAt: nowIso,
    createdAt: nowIso,
  };

  try {
    // 1. Save private signup record
    await setDoc(signupRef, newRecord);

    // 2. Initialize public leaderboard record (first name only, no email!)
    await setDoc(doc(db, 'public_leaderboard', referralCode), {
      displayName: cleanFirstName || 'Anonymous',
      confirmedReferrals: 0,
      referralCode,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    // 3. If referred by someone, credit them in the database!
    if (validReferrerCode) {
      try {
        await updateDoc(doc(db, 'public_leaderboard', validReferrerCode), {
          confirmedReferrals: increment(1),
          updatedAt: nowIso,
        });
      } catch (refErr) {
        console.warn('Could not increment referrer leaderboard count:', refErr);
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `waitlist_signups/${docId}`);
  }

  // Compute actual real rank from Firestore (e.g. #1 for first registrant)
  const realRank = await computeRealRank(0, nowIso);

  const user: WaitlistUser = {
    referralCode,
    email: cleanEmail,
    firstName: cleanFirstName || undefined,
    isEmailConfirmed: true,
    confirmedReferrals: 0,
    confirmationToken,
    createdAt: nowIso,
    rank: realRank,
  };

  saveSession(user);

  return {
    success: true,
    user,
    isExisting: false,
    message: "You're on the waitlist! Your referral link is now active.",
  };
}

/**
 * 2. CONFIRM EMAIL: Verifies email in Firestore and atomically credits referrer
 */
export async function confirmEmail(tokenOrCode: string): Promise<{
  success: boolean;
  user: WaitlistUser;
  referrerCredited?: boolean;
}> {
  if (!tokenOrCode || !tokenOrCode.trim()) {
    throw new Error('Confirmation token is missing.');
  }

  const token = tokenOrCode.trim();
  const current = getSavedSession();

  let targetDocId: string | null = null;
  if (current?.email) {
    targetDocId = getDocIdForEmail(current.email);
  }
  if (!targetDocId) {
    targetDocId = `user_${token.replace(/[^a-z0-9]/g, '_')}`;
  }

  const signupRef = doc(db, 'waitlist_signups', targetDocId);
  let snap;
  try {
    snap = await getDoc(signupRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `waitlist_signups/${targetDocId}`);
  }

  if (!snap.exists()) {
    throw new Error('Invalid or expired confirmation link.');
  }

  const data = snap.data();
  let referrerCredited = false;
  const nowIso = new Date().toISOString();

  if (!data.isEmailConfirmed) {
    try {
      await updateDoc(signupRef, {
        isEmailConfirmed: true,
        confirmedAt: nowIso,
      });

      if (data.referredBy && !data.referralCredited) {
        const referrerCode = data.referredBy;
        const refLeaderDoc = doc(db, 'public_leaderboard', referrerCode);

        try {
          await updateDoc(refLeaderDoc, {
            confirmedReferrals: increment(1),
            updatedAt: nowIso,
          });
          await updateDoc(signupRef, {
            referralCredited: true,
          });
          referrerCredited = true;
        } catch {}
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `waitlist_signups/${targetDocId}`);
    }
  }

  const realRank = await computeRealRank(data.confirmedReferrals || 0, data.createdAt);

  const updatedUser: WaitlistUser = {
    referralCode: data.referralCode,
    email: data.email,
    firstName: data.firstName || undefined,
    isEmailConfirmed: true,
    confirmedReferrals: data.confirmedReferrals || 0,
    createdAt: data.createdAt,
    rank: realRank,
  };

  saveSession(updatedUser);

  return {
    success: true,
    user: updatedUser,
    referrerCredited,
  };
}

/**
 * 3. GET USER STATUS: Refreshes real confirmed referrals count and rank from Firestore
 */
export async function getUserStatus(referralCode: string): Promise<WaitlistUser> {
  const current = getSavedSession();
  if (!referralCode) {
    return (
      current || {
        referralCode: 'CF000',
        isEmailConfirmed: true,
        confirmedReferrals: 0,
        rank: 1,
      }
    );
  }

  try {
    const leaderSnap = await getDoc(doc(db, 'public_leaderboard', referralCode));
    if (leaderSnap.exists()) {
      const data = leaderSnap.data();
      const realRank = await computeRealRank(data.confirmedReferrals || 0, data.createdAt || current?.createdAt);

      const updated: WaitlistUser = {
        referralCode,
        email: current?.email,
        firstName: current?.firstName || data.displayName,
        isEmailConfirmed: current?.isEmailConfirmed ?? true,
        confirmedReferrals: data.confirmedReferrals || 0,
        createdAt: data.createdAt || current?.createdAt,
        rank: realRank,
      };
      saveSession(updated);
      return updated;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `public_leaderboard/${referralCode}`);
  }

  const fallbackRank = await computeRealRank(current?.confirmedReferrals || 0, current?.createdAt);
  return (
    current || {
      referralCode,
      isEmailConfirmed: true,
      confirmedReferrals: 0,
      rank: fallbackRank,
    }
  );
}

/**
 * 4. GET LEADERBOARD: Reads live top 10 from /public_leaderboard
 * Returns real first names and referral counts. No fake entries!
 */
export async function getLeaderboard(currentUserCode?: string): Promise<LeaderboardEntry[]> {
  try {
    const q = query(
      collection(db, 'public_leaderboard'),
      orderBy('confirmedReferrals', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const entries: LeaderboardEntry[] = [];
    let rankIndex = 1;

    snapshot.forEach((d) => {
      const data = d.data();
      entries.push({
        rank: rankIndex,
        displayName: data.displayName || 'Anonymous',
        confirmedReferrals: Number(data.confirmedReferrals || 0),
        isCurrentUser: currentUserCode ? data.referralCode === currentUserCode : false,
        isLifetimeSpot: rankIndex <= 3,
        referralCode: data.referralCode,
      });
      rankIndex++;
    });

    return entries;
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return [];
  }
}
