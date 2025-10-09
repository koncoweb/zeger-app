import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-token',
};

interface XenditWebhook {
  id: string; // Invoice ID
  external_id: string;
  status: 'PAID' | 'EXPIRED' | 'PENDING';
  amount: number;
  paid_amount?: number;
  payment_method?: string;
  payment_channel?: string;
  paid_at?: string;
  updated?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify Xendit callback token
    const callbackToken = req.headers.get('x-callback-token');
    const expectedToken = Deno.env.get('XENDIT_CALLBACK_TOKEN');

    if (!expectedToken) {
      console.error('❌ XENDIT_CALLBACK_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook configuration error' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    if (callbackToken !== expectedToken) {
      console.error('❌ Invalid callback token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const webhookData: XenditWebhook = await req.json();

    console.log('📥 Xendit webhook received:', {
      invoice_id: webhookData.id,
      external_id: webhookData.external_id,
      status: webhookData.status,
      amount: webhookData.amount,
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find transaction by external_id
    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('external_id', webhookData.external_id)
      .single();

    if (findError || !transaction) {
      console.error('❌ Transaction not found:', webhookData.external_id);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    // Map Xendit status to our payment_status
    let paymentStatus: string;
    switch (webhookData.status) {
      case 'PAID':
        paymentStatus = 'paid';
        break;
      case 'EXPIRED':
        paymentStatus = 'expired';
        break;
      default:
        paymentStatus = 'pending';
    }

    console.log(`🔄 Updating transaction ${transaction.id} to status: ${paymentStatus}`);

    // Update transaction with payment status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        payment_status: paymentStatus,
        metadata: {
          ...transaction.metadata,
          paid_at: webhookData.paid_at,
          paid_amount: webhookData.paid_amount,
          payment_channel: webhookData.payment_channel,
          webhook_received_at: new Date().toISOString(),
        },
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('❌ Failed to update transaction:', updateError);
      throw new Error('Database update failed');
    }

    // If paid, update the associated order status
    if (paymentStatus === 'paid' && transaction.metadata?.order_id) {
      const orderId = transaction.metadata.order_id;
      
      console.log(`✅ Updating order ${orderId} to confirmed status`);

      await supabase
        .from('customer_orders')
        .update({
          status: 'confirmed',
        })
        .eq('id', orderId);
    }

    console.log('✅ Webhook processed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transaction.id,
        payment_status: paymentStatus,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Webhook processing failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
