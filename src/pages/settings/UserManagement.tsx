import { EnhancedUserManagement } from "@/components/user/EnhancedUserManagement";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncButton } from "@/components/common/SyncButton";
import { Users } from "lucide-react";

const SettingsUserManagement = () => {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Kelola pengguna dan hak akses</p>
          </div>
        </div>
        <SyncButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedUserManagement 
            role={userProfile.role as any} 
            branchId={userProfile.branch_id || undefined} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsUserManagement;