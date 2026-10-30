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

    let token: string | null = null;

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      token = body.token;
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      token = url.searchParams.get('token');
    }

    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Confirmation token is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the atomic transaction RPC function created in the migration
    const { data: result, error: rpcError } = await supabase.rpc(
      'confirm_waitlist_email',
      { p_token: token.trim() }
    );

    if (rpcError) {
      console.error('RPC confirmation error:', rpcError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify confirmation token.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!result || !result.success) {
      return new Response(
        JSON.stringify({ error: result?.error || 'Invalid or expired confirmation token.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Confirmation exception:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Server error processing confirmation.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
