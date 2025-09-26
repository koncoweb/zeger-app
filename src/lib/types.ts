// Shared type definitions for the application
import { Tables } from "@/integrations/supabase/types";

// Use Supabase generated types
export type UserRole = Tables<'profiles'>['role'];
export type Profile = Tables<'profiles'>;  
export type Branch = Tables<'branches'>;

// Helper function to get user level from role
export const getUserLevel = (role: UserRole): number => {
  if (role.startsWith('1_')) return 1; // HO level
  if (role.startsWith('2_')) return 2; // Hub level  
  if (role.startsWith('3_')) return 3; // Small Branch level
  // Legacy role mapping
  if (['ho_admin', 'ho_owner', 'ho_staff'].includes(role)) return 1;
  if (['branch_manager', 'bh_staff', 'bh_kasir', 'bh_rider'].includes(role)) return 2;
  if (['sb_branch_manager', 'sb_kasir', 'sb_rider'].includes(role)) return 3;
  return 99;
};

// Check if user can manage another user's role
export const canManageRole = (managerRole: UserRole, targetRole: UserRole): boolean => {
  const managerLevel = getUserLevel(managerRole);
  const targetLevel = getUserLevel(targetRole);
  
  // HO can manage everyone
  if (managerLevel === 1) return true;
  
  // Hub can manage Small Branch roles only
  if (managerLevel === 2) return targetLevel === 3;
  
  // Small Branch cannot manage anyone
  return false;
};