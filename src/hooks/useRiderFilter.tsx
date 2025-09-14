import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useRiderFilter = () => {
  const { userProfile } = useAuth();
  const [assignedRiderId, setAssignedRiderId] = useState<string | null>(null);
  const [assignedRiderName, setAssignedRiderName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.role === 'bh_report' && userProfile.id) {
      fetchAssignedRider();
    }
  }, [userProfile]);

  const fetchAssignedRider = async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    try {
      // Query the assignment table directly
      const { data: assignments, error } = await supabase
        .from('branch_hub_report_assignments')
        .select(`
          rider_id,
          rider:profiles!rider_id (
            id,
            full_name
          )
        `)
        .eq('user_id', userProfile.id);

      if (error) {
        console.error('Error fetching assigned rider:', error);
        return;
      }

      if (assignments && assignments.length > 0) {
        const assignment = assignments[0] as any;
        const rider = assignment.rider;
        
        if (rider) {
          setAssignedRiderId(rider.id);
          setAssignedRiderName(rider.full_name);
        }
      }
    } catch (error) {
      console.error('Error fetching assigned rider:', error);
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
    refreshAssignment: fetchAssignedRider
  };
};