import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateInvoiceRequest {
  order_id: string;
  amount: number;
  payment_method: string; // e.g., 'OVO', 'DANA', 'LINKAJA', 'SHOPEEPAY'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, amount, payment_method }: CreateInvoiceRequest = await req.json();

    console.log('📝 Creating Xendit invoice:', {
      order_id,
      amount,
      payment_method,
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('customer_orders')
      .select('*, customer_users!inner(name, phone)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Get rider or outlet info for source_id
    let sourceType = 'outlet';
    let sourceId = order.outlet_id;

    if (order.rider_id) {
      sourceType = 'rider';
      sourceId = order.rider_id;
    }

    // Generate external_id for Xendit
    const timestamp = Date.now();
    const externalId = `ZEG-${sourceType}-${sourceId?.substring(0, 8)}-${timestamp}`;

    // Create Xendit invoice
    const xenditApiKey = Deno.env.get('XENDIT_SECRET_KEY');
    if (!xenditApiKey) {
      throw new Error('XENDIT_SECRET_KEY not configured');
    }

    const xenditResponse = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(xenditApiKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: amount,
        payer_email: 'customer@zegercoffee.com', // Can be dynamic if available
        description: `Pembayaran pesanan #${order.id.substring(0, 8)}`,
        invoice_duration: 86400, // 24 hours
        payment_methods: [payment_method],
        success_redirect_url: `${supabaseUrl}/customer/order-success?order_id=${order_id}`,
        failure_redirect_url: `${supabaseUrl}/customer/payment-failed?order_id=${order_id}`,
      }),
    });

    if (!xenditResponse.ok) {
      const errorText = await xenditResponse.text();
      console.error('❌ Xendit API error:', errorText);
      throw new Error(`Xendit API error: ${xenditResponse.status}`);
    }

    const xenditData = await xenditResponse.json();

    console.log('✅ Xendit invoice created:', {
      invoice_id: xenditData.id,
      invoice_url: xenditData.invoice_url,
    });

    // Create transaction record in database
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        external_id: externalId,
        xendit_invoice_id: xenditData.id,
        source_type: sourceType,
        source_id: sourceId,
        payment_status: 'pending',
        final_amount: amount,
        payment_method: payment_method.toLowerCase(),
        metadata: {
          order_id: order_id,
          xendit_invoice_url: xenditData.invoice_url,
          xendit_expiry_date: xenditData.expiry_date,
        },
      })
      .select()
      .single();

    if (transactionError) {
      console.error('❌ Transaction creation error:', transactionError);
      throw new Error('Failed to create transaction record');
    }

    // Update order with transaction info
    await supabase
      .from('customer_orders')
      .update({
        payment_method: payment_method.toLowerCase(),
      })
      .eq('id', order_id);

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transaction.id,
        external_id: externalId,
        invoice_id: xenditData.id,
        invoice_url: xenditData.invoice_url,
        amount: amount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Error creating invoice:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create payment invoice',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
