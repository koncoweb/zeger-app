import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Settings,
  Save,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserRolePermissionsProps {
  role: 'ho_admin' | 'ho_owner' | 'branch_manager';
}

interface Permission {
  id: string;
  role_name: string;
  module_name: string;
  permission: 'view' | 'insert' | 'update' | 'delete' | 'approve' | 'release';
  is_granted: boolean;
}

const MODULES = [
  'users', 'branches', 'inventory', 'reports', 'financial', 
  'transactions', 'customers', 'attendance'
];

const PERMISSIONS = [
  { value: 'view', label: 'View' },
  { value: 'insert', label: 'Insert' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'approve', label: 'Approve' },
  { value: 'release', label: 'Release' }
];

const ROLES = [
  { value: 'ho_admin', label: 'HO Admin' },
  { value: 'branch_manager', label: 'Branch Manager' },
  { value: 'rider', label: 'Mobile Seller' },
  { value: 'finance', label: 'Finance' }
];

export const UserRolePermissions = ({ role }: UserRolePermissionsProps) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('rider');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, [selectedRole]);

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_role_permissions')
        .select('*')
        .eq('role_name', selectedRole)
        .order('module_name');

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat permission: " + error.message);
    }
  };

  const updatePermission = async (permissionId: string, isGranted: boolean) => {
    try {
      const { error } = await supabase
        .from('user_role_permissions')
        .update({ is_granted: isGranted })
        .eq('id', permissionId);

      if (error) throw error;

      setPermissions(prev => prev.map(p => 
        p.id === permissionId ? { ...p, is_granted: isGranted } : p
      ));

      toast.success("Permission berhasil diupdate");
    } catch (error: any) {
      toast.error("Gagal update permission: " + error.message);
    }
  };

  const saveAllPermissions = async () => {
    setLoading(true);
    try {
      const updates = permissions.map(p => ({
        id: p.id,
        is_granted: p.is_granted
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('user_role_permissions')
          .update({ is_granted: update.is_granted })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success("Semua permission berhasil disimpan");
    } catch (error: any) {
      toast.error("Gagal menyimpan permission: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by module
  const groupedPermissions = MODULES.reduce((acc, module) => {
    acc[module] = PERMISSIONS.map(perm => {
      const existing = permissions.find(p => 
        p.module_name === module && p.permission === perm.value
      );
      return {
        ...perm,
        isGranted: existing?.is_granted || false,
        id: existing?.id || ''
      };
    });
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Permissions Management
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Kelola Permission
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Kelola Role Permissions</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Pilih Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.filter(r => role === 'ho_admin' || r.value !== 'ho_admin').map((roleOption) => (
                          <SelectItem key={roleOption.value} value={roleOption.value}>
                            {roleOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Badge variant="outline">
                      {ROLES.find(r => r.value === selectedRole)?.label}
                    </Badge>
                  </div>

                  <ScrollArea className="h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Module</TableHead>
                          {PERMISSIONS.map(perm => (
                            <TableHead key={perm.value} className="text-center">
                              {perm.label}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {MODULES.map(module => (
                          <TableRow key={module}>
                            <TableCell className="font-medium capitalize">
                              {module}
                            </TableCell>
                            {groupedPermissions[module]?.map((perm, index) => (
                              <TableCell key={index} className="text-center">
                                <Checkbox
                                  checked={perm.isGranted}
                                  onCheckedChange={(checked) => {
                                    if (perm.id) {
                                      updatePermission(perm.id, !!checked);
                                    }
                                  }}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={saveAllPermissions} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Menyimpan..." : "Simpan Semua"}
                    </Button>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Tutup
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Klik "Kelola Permission" untuk mengatur hak akses role</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};