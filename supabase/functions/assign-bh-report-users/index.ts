import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Create bh_report users and assign them to riders
    const assignments = [
      {
        email: 'Dyahnovita46@gmail.com',
        riderCode: 'Z-005',
        riderName: 'Pak Tri',
        fullName: 'Dyah Novita'
      },
      {
        email: 'ino_ech@yahoo.co.id',
        riderCode: 'Z-006', 
        riderName: 'Pak Dhani',
        fullName: 'Ino Ech'
      },
      {
        email: 'hisjam1@gmail.com',
        riderCode: 'Z-010',
        riderName: 'Fajar',
        fullName: 'Hisjam'
      },
      {
        email: 'nurmaulidafitriasupriyadi@gmail.com',
        riderCode: 'Z-013',
        riderName: 'Pak Imam',
        fullName: 'Nur Maulida'
      },
      {
        email: 'diantriviazka@gmail.com',
        riderCode: 'Z-012',
        riderName: 'Pak Nanda',
        fullName: 'Bu Dian'
      }
    ];

    // Also create rider accounts
    const riderAccounts = [
      {
        email: 'rinanda.sandy@gmail.com',
        riderCode: 'Z-012',
        riderName: 'Pak Nanda',
        fullName: 'Pak Nanda',
        role: 'rider'
      }
    ];

    const results = [];

    // First create rider accounts
    for (const riderAccount of riderAccounts) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUser.users.find(u => u.email === riderAccount.email);

        let userId;
        if (userExists) {
          userId = userExists.id;
          console.log(`Rider ${riderAccount.email} already exists`);
        } else {
          // Create rider user
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: riderAccount.email,
            password: 'zeger1234',
            email_confirm: true,
            user_metadata: {
              full_name: riderAccount.fullName
            }
          });

          if (createError) {
            console.error('Error creating rider:', createError);
            results.push({
              email: riderAccount.email,
              status: 'error',
              message: `Error creating rider: ${createError.message}`
            });
            continue;
          }

          userId = newUser.user.id;
        }

        // Check if profile exists
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          // Update existing profile
          await supabaseAdmin
            .from('profiles')
            .update({
              role: 'rider',
              full_name: riderAccount.fullName
            })
            .eq('id', existingProfile.id);
        } else {
          // Create rider profile
          await supabaseAdmin
            .from('profiles')
            .insert({
              user_id: userId,
              full_name: riderAccount.fullName,
              role: 'rider',
              app_access_type: 'mobile'
            });
        }

        results.push({
          email: riderAccount.email,
          status: 'success',
          message: `Successfully created rider ${riderAccount.fullName}`
        });

      } catch (error) {
        console.error('Error processing rider account:', error);
        results.push({
          email: riderAccount.email,
          status: 'error',
          message: `Unexpected error: ${(error as Error).message}`
        });
      }
    }

    // Then create bh_report assignments
    for (const assignment of assignments) {
      try {
        // Find rider by name (search in full_name field)
        const { data: riders, error: riderError } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'rider')
          .ilike('full_name', `%${assignment.riderName}%`);

        if (riderError) {
          console.error('Error finding rider:', riderError);
          results.push({
            email: assignment.email,
            status: 'error',
            message: `Error finding rider: ${riderError.message}`
          });
          continue;
        }

        if (!riders || riders.length === 0) {
          results.push({
            email: assignment.email,
            status: 'error',
            message: `Rider ${assignment.riderName} not found`
          });
          continue;
        }

        const rider = riders[0];

        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUser.users.find(u => u.email === assignment.email);

        let userId;
        if (userExists) {
          userId = userExists.id;
          console.log(`User ${assignment.email} already exists`);
        } else {
          // Create user
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: assignment.email,
            password: 'zeger1234',
            email_confirm: true,
            user_metadata: {
              full_name: assignment.fullName
            }
          });

          if (createError) {
            console.error('Error creating user:', createError);
            results.push({
              email: assignment.email,
              status: 'error',
              message: `Error creating user: ${createError.message}`
            });
            continue;
          }

          userId = newUser.user.id;
        }

        // Check if profile exists
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        let profileId;
        if (existingProfile) {
          profileId = existingProfile.id;
          // Update existing profile to bh_report role
          await supabaseAdmin
            .from('profiles')
            .update({
              role: 'bh_report',
              full_name: assignment.fullName
            })
            .eq('id', profileId);
        } else {
          // Create profile
          const { data: newProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              user_id: userId,
              full_name: assignment.fullName,
              role: 'bh_report',
              app_access_type: 'web_backoffice'
            })
            .select('id')
            .single();

          if (profileError) {
            console.error('Error creating profile:', profileError);
            results.push({
              email: assignment.email,
              status: 'error',
              message: `Error creating profile: ${profileError.message}`
            });
            continue;
          }

          profileId = newProfile.id;
        }

        // Create or update assignment
        const { error: assignmentError } = await supabaseAdmin
          .from('branch_hub_report_assignments')
          .upsert({
            user_id: profileId,
            rider_id: rider.id
          });

        if (assignmentError) {
          console.error('Error creating assignment:', assignmentError);
          results.push({
            email: assignment.email,
            status: 'error',
            message: `Error creating assignment: ${assignmentError.message}`
          });
          continue;
        }

        results.push({
          email: assignment.email,
          status: 'success',
          message: `Successfully assigned to rider ${rider.full_name}`,
          riderId: rider.id,
          riderName: rider.full_name
        });

      } catch (error) {
        console.error('Error processing assignment:', error);
        results.push({
          email: assignment.email,
          status: 'error',
          message: `Unexpected error: ${(error as Error).message}`
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});