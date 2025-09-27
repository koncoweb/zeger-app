import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Update transaction payment method request received');
    
    // Get the Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user and get their profile
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('❌ Invalid user token:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('👤 User authenticated:', user.id);

    // Get user profile to check role and branch
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, branch_id, full_name')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission to update transactions
    if (profile.role !== 'ho_admin' && profile.role !== 'branch_manager') {
      console.error('❌ Insufficient permissions. Role:', profile.role);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only HO Admin or Branch Manager can update payment methods.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { transaction_id, new_payment_method } = body;

    // Validate input
    if (!transaction_id || !new_payment_method) {
      console.error('❌ Missing required fields:', { transaction_id, new_payment_method });
      return new Response(
        JSON.stringify({ error: 'transaction_id and new_payment_method are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate payment method
    const validPaymentMethods = ['cash', 'qris', 'transfer'];
    if (!validPaymentMethods.includes(new_payment_method)) {
      console.error('❌ Invalid payment method:', new_payment_method);
      return new Response(
        JSON.stringify({ error: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the transaction to verify ownership/branch access
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('id, transaction_number, branch_id, rider_id, payment_method')
      .eq('id', transaction_id)
      .single();

    if (txError || !transaction) {
      console.error('❌ Transaction not found:', txError);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Branch managers can only update transactions from their branch
    if (profile.role === 'branch_manager' && transaction.branch_id !== profile.branch_id) {
      console.error('❌ Branch access denied. User branch:', profile.branch_id, 'Transaction branch:', transaction.branch_id);
      return new Response(
        JSON.stringify({ error: 'Access denied. You can only update transactions from your branch.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Updating transaction payment method:', {
      transaction_id,
      from: transaction.payment_method,
      to: new_payment_method,
      by: profile.full_name
    });

    // Update the transaction
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ payment_method: new_payment_method })
      .eq('id', transaction_id);

    if (updateError) {
      console.error('❌ Failed to update transaction:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Transaction payment method updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment method updated successfully',
        transaction_id,
        old_payment_method: transaction.payment_method,
        new_payment_method,
        updated_by: profile.full_name
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});