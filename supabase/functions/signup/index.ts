import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { corsHeaders } from '../_shared/cors.ts';

interface SignupRequest {
  email: string;
  firstName?: string;
  referrerCode?: string | null;
  consent: boolean;
}

// Generate 8-character alphanumeric referral code
function generateCode(name?: string): string {
  const prefix = name
    ? name
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 4)
    : '';

  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  const needed = 8 - prefix.length;
  for (let i = 0; i < (needed > 4 ? needed : 4); i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return (prefix + randomPart).slice(0, 8);
}

// Basic email format check
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
    const siteUrl = Deno.env.get('SITE_URL') ?? '[site URL]';
    const fromEmail = Deno.env.get('FROM_EMAIL') ?? '[from email]';
    const contactEmail = Deno.env.get('CONTACT_EMAIL') ?? '[contact email]';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase service configuration missing.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Rate Limiting Check (At most 5 signup attempts per IP per hour)
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('cf-connecting-ip') ||
      'unknown-ip';

    if (clientIp !== 'unknown-ip') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('waitlist_rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', clientIp)
        .gte('attempt_at', oneHourAgo);

      if (count && count >= 5) {
        return new Response(
          JSON.stringify({
            error: 'Too many signup attempts. Please try again in an hour.',
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record this attempt
      await supabase
        .from('waitlist_rate_limits')
        .insert({ ip_address: clientIp });
    }

    // 2. Parse & Validate Payload
    const body: SignupRequest = await req.json();
    const rawEmail = body.email;
    const consent = body.consent;
    const firstName = body.firstName ? body.firstName.trim().slice(0, 50) : null;
    const rawReferrerCode = body.referrerCode ? body.referrerCode.trim().toUpperCase() : null;

    if (!rawEmail || !isValidEmail(rawEmail)) {
      return new Response(
        JSON.stringify({ error: 'Please provide a valid email address.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!consent) {
      return new Response(
        JSON.stringify({
          error: 'You must agree to receive launch updates to join the waitlist.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = rawEmail.trim().toLowerCase();

    // 3. Duplicate Email Check
    const { data: existingUser } = await supabase
      .from('waitlist_signups')
      .select('referral_code, first_name, confirmed_referrals, is_email_confirmed')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      // Return user's referral code with friendly message
      return new Response(
        JSON.stringify({
          success: true,
          isExisting: true,
          message: "You're already on the waitlist! Showing your active dashboard.",
          referral_code: existingUser.referral_code,
          first_name: existingUser.first_name,
          confirmed_referrals: existingUser.confirmed_referrals,
          is_email_confirmed: existingUser.is_email_confirmed,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Validate Referrer Code & Self-Referral Prevention
    let validReferredBy: string | null = null;
    if (rawReferrerCode) {
      const { data: referrer } = await supabase
        .from('waitlist_signups')
        .select('email, referral_code')
        .eq('referral_code', rawReferrerCode)
        .maybeSingle();

      // Only credit if referrer exists and email does NOT match the signing up email
      if (referrer && referrer.email.toLowerCase() !== cleanEmail) {
        validReferredBy = referrer.referral_code;
      }
    }

    // 5. Generate Unique Referral Code (with collision retry)
    let referralCode = generateCode(firstName || undefined);
    let collision = true;
    let attempts = 0;

    while (collision && attempts < 5) {
      const { data: existingCode } = await supabase
        .from('waitlist_signups')
        .select('id')
        .eq('referral_code', referralCode)
        .maybeSingle();

      if (!existingCode) {
        collision = false;
      } else {
        referralCode = generateCode();
        attempts++;
      }
    }

    // 6. Generate 48-Hour Confirmation Token
    const confirmationToken = `tok_${crypto.randomUUID().replace(/-/g, '')}`;
    const tokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // 7. Insert Row
    const { error: insertError } = await supabase
      .from('waitlist_signups')
      .insert({
        email: cleanEmail,
        first_name: firstName,
        referral_code: referralCode,
        referred_by: validReferredBy,
        confirmation_token: confirmationToken,
        token_expires_at: tokenExpiresAt,
        is_email_confirmed: false,
        confirmed_referrals: 0,
        consent_given: true,
        consent_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to record signup. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Send Confirmation Email via Resend
    let emailSent = false;
    if (resendApiKey && resendApiKey !== 'YOUR_RESEND_API_KEY') {
      const confirmUrl = `https://${siteUrl}/?confirm=${confirmationToken}`;
      const greeting = firstName ? `Hi ${firstName},` : 'Hello,';

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Confirm your spot on the ClientFlow early group</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #334155; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;">
    <div style="margin-bottom: 24px;">
      <span style="font-weight: 700; font-size: 20px; color: #0f172a;">Client<span style="color: #4DA3FF;">Flow</span></span>
    </div>

    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">${greeting}</p>
    
    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      Thank you for signing up for early access to ClientFlow. We are getting things ready for our first group.
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      Please confirm your email address below to lock in your position on the waitlist and activate your personal referral link:
    </p>

    <div style="margin: 32px 0; text-align: left;">
      <a href="${confirmUrl}" style="background-color: #4DA3FF; color: #ffffff; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">
        Confirm your email spot
      </a>
    </div>

    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px;">
      Or paste this link into your browser:<br>
      <a href="${confirmUrl}" style="color: #4DA3FF; word-break: break-all;">${confirmUrl}</a>
    </p>

    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0 16px 0;">

    <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
      This link expires in 48 hours. If you did not request this email, you can ignore it or contact us at <a href="mailto:${contactEmail}" style="color: #94a3b8;">${contactEmail}</a> to be removed.
    </p>
  </div>
</body>
</html>
      `;

      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `ClientFlow <${fromEmail}>`,
            to: [cleanEmail],
            subject: 'Confirm your email for the ClientFlow early group',
            html: emailHtml,
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
        } else {
          const errData = await resendRes.text();
          console.error('Resend delivery error:', errData);
        }
      } catch (err) {
        console.error('Resend fetch failed:', err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        isExisting: false,
        referral_code: referralCode,
        first_name: firstName,
        confirmed_referrals: 0,
        is_email_confirmed: false,
        email_sent: emailSent,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Signup error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Server error processing signup.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
