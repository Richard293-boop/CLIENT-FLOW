import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let referralCode: string | null = null;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      referralCode = url.searchParams.get('referral_code');
    } else if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      referralCode = body.referral_code;
    }

    if (!referralCode || typeof referralCode !== 'string') {
      return new Response(
        JSON.stringify({ error: 'referral_code parameter is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call secure RPC that computes rank and returns only non-sensitive user metadata
    const { data: statusData, error: rpcError } = await supabase.rpc('get_user_status', {
      p_referral_code: referralCode.trim().toUpperCase(),
    });

    if (rpcError) {
      console.error('RPC get_user_status error:', rpcError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve referral status.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!statusData || !statusData.success) {
      return new Response(
        JSON.stringify({ error: statusData?.error || 'Referral code not found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(statusData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Status exception:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Server error retrieving status.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
