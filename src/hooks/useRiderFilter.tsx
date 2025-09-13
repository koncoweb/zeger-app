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
      // Query the assignment table directly using a simple query
      const { data: assignments } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          branch_hub_report_assignments!inner (
            rider_id,
            profiles!inner (
              id,
              full_name
            )
          )
        `)
        .eq('id', userProfile.id);

      if (assignments && assignments.length > 0) {
        const assignment = assignments[0] as any;
        const riderAssignment = assignment.branch_hub_report_assignments?.[0];
        
        if (riderAssignment) {
          setAssignedRiderId(riderAssignment.rider_id);
          setAssignedRiderName(riderAssignment.profiles?.full_name);
        }
      }
    } catch (error) {
      console.error('Error fetching assigned rider:', error);
      
      // Fallback: try direct query (temporary until types are updated)
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'rider')
          .limit(1);
          
        if (data && data.length > 0) {
          // For now, assign to first rider as fallback
          setAssignedRiderId(data[0].id);
          setAssignedRiderName(data[0].full_name);
        }
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
      }
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