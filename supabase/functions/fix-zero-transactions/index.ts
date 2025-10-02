import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify user has permission (ho_admin only)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'ho_admin') {
      return new Response(JSON.stringify({ error: 'Only HO Admin can fix transactions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { rider_id, start_date, end_date } = await req.json();

    console.log('Fixing zero transactions for rider:', rider_id, 'date range:', start_date, end_date);

    // Find transactions with final_amount = 0 but have items
    const { data: zeroTransactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('id, transaction_number, total_amount, discount_amount, final_amount')
      .eq('rider_id', rider_id)
      .eq('final_amount', 0)
      .eq('status', 'completed')
      .gte('transaction_date', start_date)
      .lte('transaction_date', end_date);

    if (txError) throw txError;

    console.log(`Found ${zeroTransactions?.length || 0} transactions with Rp 0`);

    const fixed = [];
    const skipped = [];

    for (const tx of zeroTransactions || []) {
      // Get transaction items
      const { data: items } = await supabaseAdmin
        .from('transaction_items')
        .select('total_price')
        .eq('transaction_id', tx.id);

      const itemsTotal = items?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0;

      if (itemsTotal > 0) {
        // Recalculate: if discount >= total, set discount to 0
        const newDiscount = Number(tx.discount_amount) >= Number(tx.total_amount) ? 0 : Number(tx.discount_amount);
        const newFinal = Number(tx.total_amount) - newDiscount;

        // Update transaction
        const { error: updateError } = await supabaseAdmin
          .from('transactions')
          .update({
            discount_amount: newDiscount,
            final_amount: newFinal
          })
          .eq('id', tx.id);

        if (updateError) {
          console.error(`Failed to update ${tx.transaction_number}:`, updateError);
          skipped.push({ transaction_number: tx.transaction_number, error: updateError.message });
        } else {
          fixed.push({
            transaction_number: tx.transaction_number,
            old_final: tx.final_amount,
            new_final: newFinal,
            discount_reset: newDiscount !== Number(tx.discount_amount)
          });
        }
      } else {
        skipped.push({ transaction_number: tx.transaction_number, reason: 'No items found' });
      }
    }

    console.log('Fix completed:', { fixed: fixed.length, skipped: skipped.length });

    return new Response(JSON.stringify({
      success: true,
      message: `Fixed ${fixed.length} transactions, skipped ${skipped.length}`,
      fixed,
      skipped
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in fix-zero-transactions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
