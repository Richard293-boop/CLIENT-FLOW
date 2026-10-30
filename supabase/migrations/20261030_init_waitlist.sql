-- ============================================================================
-- ClientFlow Waitlist Database Schema & Migration
-- ============================================================================

-- 1. Create table: waitlist_signups
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  confirmation_token TEXT UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  is_email_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  referral_credited BOOLEAN DEFAULT FALSE,
  confirmed_referrals INTEGER DEFAULT 0 CHECK (confirmed_referrals >= 0),
  consent_given BOOLEAN NOT NULL,
  consent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case-insensitive unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_signups_lower_email 
  ON public.waitlist_signups (LOWER(email));

-- Query performance indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_ref_code 
  ON public.waitlist_signups (referral_code);

CREATE INDEX IF NOT EXISTS idx_waitlist_signups_token 
  ON public.waitlist_signups (confirmation_token);

CREATE INDEX IF NOT EXISTS idx_waitlist_signups_confirmed_refs 
  ON public.waitlist_signups (confirmed_referrals DESC, created_at ASC);

-- 2. Rate limiting table (tracks IP attempts for Edge Function rate limiting)
CREATE TABLE IF NOT EXISTS public.waitlist_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  attempt_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_rate_limits_ip_time 
  ON public.waitlist_rate_limits (ip_address, attempt_at);

-- 3. Row Level Security (RLS)
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_rate_limits ENABLE ROW LEVEL SECURITY;

-- Deny all direct access to anonymous users: anon key cannot select, insert, update or delete.
-- All writes and reads happen through security definer RPC functions or Supabase Edge Functions
-- that use the server-side service role key.
DROP POLICY IF EXISTS "Deny anon access on waitlist_signups" ON public.waitlist_signups;
CREATE POLICY "Deny anon access on waitlist_signups"
  ON public.waitlist_signups
  FOR ALL
  TO anon
  USING (false);

DROP POLICY IF EXISTS "Deny anon access on waitlist_rate_limits" ON public.waitlist_rate_limits;
CREATE POLICY "Deny anon access on waitlist_rate_limits"
  ON public.waitlist_rate_limits
  FOR ALL
  TO anon
  USING (false);

-- 4. Secure RPC function: get_leaderboard
-- Returns ONLY first_name (or "Anonymous") and confirmed_referrals for top 10.
-- Never exposes emails or personal contact info to the public.
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  rank BIGINT,
  display_name TEXT,
  confirmed_referrals INTEGER,
  is_lifetime_spot BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY ws.confirmed_referrals DESC, ws.created_at ASC) AS rank,
    COALESCE(NULLIF(TRIM(ws.first_name), ''), 'Anonymous') AS display_name,
    ws.confirmed_referrals,
    (ROW_NUMBER() OVER (ORDER BY ws.confirmed_referrals DESC, ws.created_at ASC) <= 3) AS is_lifetime_spot
  FROM public.waitlist_signups ws
  WHERE ws.is_email_confirmed = TRUE
  ORDER BY ws.confirmed_referrals DESC, ws.created_at ASC
  LIMIT 10;
$$;

-- Grant execution to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO anon, authenticated;

-- 5. Secure Transactional RPC function: confirm_waitlist_email
-- Atomically validates token, confirms email, and credits referrer once.
CREATE OR REPLACE FUNCTION public.confirm_waitlist_email(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_referrer RECORD;
  v_user_rank BIGINT;
  v_credited BOOLEAN := FALSE;
BEGIN
  -- Look up user by confirmation token
  SELECT * INTO v_user
  FROM public.waitlist_signups
  WHERE confirmation_token = TRIM(p_token);

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired confirmation token.'
    );
  END IF;

  -- Check token expiration
  IF v_user.token_expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This confirmation link has expired. Please sign up again.'
    );
  END IF;

  -- If not already confirmed, mark confirmed
  IF NOT v_user.is_email_confirmed THEN
    UPDATE public.waitlist_signups
    SET
      is_email_confirmed = TRUE,
      confirmed_at = NOW()
    WHERE id = v_user.id;
  END IF;

  -- If user was referred by someone and hasn't been credited yet
  IF v_user.referred_by IS NOT NULL AND NOT v_user.referral_credited THEN
    -- Look up referrer
    SELECT * INTO v_referrer
    FROM public.waitlist_signups
    WHERE referral_code = v_user.referred_by;

    IF FOUND THEN
      -- Increment referrer's count atomically
      UPDATE public.waitlist_signups
      SET confirmed_referrals = confirmed_referrals + 1
      WHERE id = v_referrer.id;

      -- Mark referral as credited so it cannot be counted twice
      UPDATE public.waitlist_signups
      SET referral_credited = TRUE
      WHERE id = v_user.id;

      v_credited := TRUE;
    END IF;
  END IF;

  -- Calculate rank (count how many users have strictly more referrals + 1)
  SELECT COUNT(*) + 1 INTO v_user_rank
  FROM public.waitlist_signups
  WHERE is_email_confirmed = TRUE
    AND confirmed_referrals > v_user.confirmed_referrals;

  RETURN jsonb_build_object(
    'success', true,
    'referral_code', v_user.referral_code,
    'first_name', v_user.first_name,
    'confirmed_referrals', v_user.confirmed_referrals,
    'is_email_confirmed', true,
    'rank', v_user_rank,
    'referrer_credited', v_credited
  );
END;
$$;

-- Grant execution to anon and service_role
GRANT EXECUTE ON FUNCTION public.confirm_waitlist_email(TEXT) TO anon, authenticated, service_role;

-- 6. Secure RPC function: get_user_status
-- Returns only the user's own status and rank given a referral code.
-- Never exposes emails or other users' private data.
CREATE OR REPLACE FUNCTION public.get_user_status(p_referral_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_user RECORD;
  v_user_rank BIGINT;
BEGIN
  SELECT * INTO v_user
  FROM public.waitlist_signups
  WHERE referral_code = UPPER(TRIM(p_referral_code));

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Referral code not found.'
    );
  END IF;

  -- Calculate rank among confirmed users
  IF v_user.is_email_confirmed THEN
    SELECT COUNT(*) + 1 INTO v_user_rank
    FROM public.waitlist_signups
    WHERE is_email_confirmed = TRUE
      AND confirmed_referrals > v_user.confirmed_referrals;
  ELSE
    -- Unconfirmed users default to baseline queue position
    SELECT COUNT(*) + 35 INTO v_user_rank
    FROM public.waitlist_signups
    WHERE is_email_confirmed = TRUE;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'referral_code', v_user.referral_code,
    'first_name', v_user.first_name,
    'confirmed_referrals', v_user.confirmed_referrals,
    'is_email_confirmed', v_user.is_email_confirmed,
    'rank', v_user_rank
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_status(TEXT) TO anon, authenticated, service_role;
