import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !currentUser) {
      throw new Error('Unauthorized');
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', currentUser.id)
      .single();

    if (!currentProfile) {
      throw new Error('Profile not found');
    }

    const allowedRoles = ['ho_admin', '1_HO_Admin', '1_HO_Owner', 'branch_manager', '2_Hub_Branch_Manager'];
    if (!allowedRoles.includes(currentProfile.role)) {
      throw new Error('Insufficient permissions');
    }

    const { userId, newEmail } = await req.json();

    if (!userId || !newEmail) {
      throw new Error('Missing required fields');
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { email: newEmail }
    );

    if (updateError) {
      throw updateError;
    }

    console.log(`Email updated for user ${userId} to ${newEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Email updated successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error updating user email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
