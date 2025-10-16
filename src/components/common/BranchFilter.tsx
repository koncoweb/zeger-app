import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Branch {
  id: string;
  name: string;
  branch_type: string;
  level: number;
}

interface BranchFilterProps {
  userBranchId: string;
  userRole: string;
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
}

export const BranchFilter = ({ userBranchId, userRole, selectedBranchId, onBranchChange }: BranchFilterProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  
  useEffect(() => {
    fetchBranches();
  }, [userBranchId, userRole]);
  
  const fetchBranches = async () => {
    // Only show for branch_manager role
    if (userRole !== 'branch_manager') return;
    
    try {
      // Get current branch
      const { data: current } = await supabase
        .from('branches')
        .select('*')
        .eq('id', userBranchId)
        .eq('branch_type', 'hub')
        .maybeSingle();
      
      if (!current) return; // Not a hub, don't show filter
      
      setCurrentBranch(current);
      
      // Get child branches (small branches under this hub)
      const { data: children } = await supabase
        .from('branches')
        .select('id, name, branch_type, level')
        .eq('parent_branch_id', userBranchId)
        .eq('is_active', true)
        .order('name');
      
      // Combine: [hub itself, ...small branches]
      const allBranches = [
        current,
        ...(children || [])
      ];
      
      setBranches(allBranches);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };
  
  // Only show if user is branch_manager AND has child branches
  if (userRole !== 'branch_manager' || !currentBranch || branches.length <= 1) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      <Label>Filter Cabang</Label>
      <Select value={selectedBranchId} onValueChange={onBranchChange}>
        <SelectTrigger>
          <Building className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Pilih cabang" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={currentBranch.id}>
            {currentBranch.name} (Hub)
          </SelectItem>
          {branches.slice(1).map(branch => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
          <SelectItem value="all">Semua Cabang</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
