import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useRiderFilter = () => {
  const { userProfile } = useAuth();
  const [assignedRiderId, setAssignedRiderId] = useState<string | null>(null);
  const [assignedRiderName, setAssignedRiderName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.role === 'bh_report' && userProfile.id) {
      console.log('🔍 BH Report user detected, fetching assigned rider for:', userProfile.full_name);
      fetchAssignedRider();
    }
  }, [userProfile]);

  const fetchAssignedRider = async () => {
    if (!userProfile?.id) {
      console.log('❌ No userProfile.id available');
      return;
    }
    
    console.log('🚀 Starting fetchAssignedRider for user:', userProfile.full_name, 'ID:', userProfile.id);
    setLoading(true);
    setError(null);
    
    try {
      // Query the assignment table directly
      const { data: assignments, error } = await supabase
        .from('branch_hub_report_assignments')
        .select(`
          rider_id,
          user_id,
          rider:profiles!rider_id (
            id,
            full_name
          )
        `)
        .eq('user_id', userProfile.id);

      console.log('📊 Assignment query result:', { assignments, error });

      if (error) {
        console.error('❌ Error fetching assigned rider:', error);
        setError(`Database error: ${error.message}`);
        return;
      }

      if (assignments && assignments.length > 0) {
        const assignment = assignments[0] as any;
        const rider = assignment.rider;
        
        console.log('✅ Assignment found:', assignment);
        
        if (rider) {
          console.log('🎯 Setting assigned rider:', rider.full_name, 'ID:', rider.id);
          setAssignedRiderId(rider.id);
          setAssignedRiderName(rider.full_name);
        } else {
          console.log('❌ No rider data in assignment');
          setError('Rider data not found in assignment');
        }
      } else {
        console.log('❌ No assignments found for user:', userProfile.full_name);
        setError('No rider assignment found for this user');
      }
    } catch (error: any) {
      console.error('❌ Exception in fetchAssignedRider:', error);
      setError(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const shouldAutoFilter = userProfile?.role === 'bh_report' && assignedRiderId;

  return {
    assignedRiderId,
    assignedRiderName,
    shouldAutoFilter,
    loading,
    error,
    refreshAssignment: fetchAssignedRider
  };
};