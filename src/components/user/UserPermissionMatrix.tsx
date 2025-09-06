import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface ModulePermission {
  module: string;
  permissions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve?: boolean;
  };
  resourceFilter?: {
    type: 'all' | 'branch' | 'rider_specific';
    riderIds?: string[];
  };
}

interface UserPermissionMatrixProps {
  role: string;
  onPermissionsChange: (permissions: ModulePermission[]) => void;
  riders?: Array<{ id: string; name: string; code: string }>;
}

interface ModuleConfig {
  name: string;
  permissions: string[];
  subModules?: string[];
  hasResourceFilter?: boolean;
}

const MODULES: Record<string, ModuleConfig> = {
  dashboard: { name: "Dashboard", permissions: ["view"] },
  inventory: { 
    name: "Inventory", 
    permissions: ["view", "create", "edit", "delete"],
    subModules: ["stock_management", "production", "transfers"]
  },
  sales: { 
    name: "Sales & Transactions", 
    permissions: ["view", "create", "edit", "approve"],
    hasResourceFilter: true
  },
  reports: { 
    name: "Reports", 
    permissions: ["view"],
    hasResourceFilter: true
  },
  users: { 
    name: "User Management", 
    permissions: ["view", "create", "edit", "delete"]
  },
  finance: { 
    name: "Finance", 
    permissions: ["view", "create", "edit", "approve"]
  },
  attendance: { 
    name: "Attendance", 
    permissions: ["view", "create", "edit"]
  },
  customers: { 
    name: "Customer Management", 
    permissions: ["view", "create", "edit"]
  }
};

export function UserPermissionMatrix({ role, onPermissionsChange, riders = [] }: UserPermissionMatrixProps) {
  const [permissions, setPermissions] = useState<ModulePermission[]>(
    Object.entries(MODULES).map(([key, module]) => ({
      module: key,
      permissions: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
      },
      resourceFilter: module.hasResourceFilter ? { type: 'all' } : undefined
    }))
  );

  const updatePermission = (moduleKey: string, permissionType: string, value: boolean) => {
    const updated = permissions.map(p => 
      p.module === moduleKey 
        ? { ...p, permissions: { ...p.permissions, [permissionType]: value } }
        : p
    );
    setPermissions(updated);
    onPermissionsChange(updated);
  };

  const updateResourceFilter = (moduleKey: string, filterType: 'all' | 'branch' | 'rider_specific', riderIds?: string[]) => {
    const updated = permissions.map(p => 
      p.module === moduleKey 
        ? { 
            ...p, 
            resourceFilter: { 
              type: filterType, 
              riderIds: filterType === 'rider_specific' ? riderIds : undefined 
            }
          }
        : p
    );
    setPermissions(updated);
    onPermissionsChange(updated);
  };

  const getDefaultPermissions = (role: string) => {
    const roleDefaults: { [key: string]: string[] } = {
      'bh_staff': ['dashboard', 'inventory', 'sales', 'reports'],
      'bh_kasir': ['dashboard', 'sales', 'customers'],
      'bh_report': ['dashboard', 'reports', 'sales'],
      'sb_branch_manager': ['dashboard', 'inventory', 'sales', 'reports', 'users', 'attendance'],
      'sb_kasir': ['dashboard', 'sales', 'customers'],
      'sb_rider': ['dashboard', 'sales', 'customers', 'attendance'],
      'sb_report': ['dashboard', 'reports', 'sales']
    };
    return roleDefaults[role] || [];
  };

  const applyRoleDefaults = () => {
    const defaultModules = getDefaultPermissions(role);
    const updated = permissions.map(p => ({
      ...p,
      permissions: {
        ...p.permissions,
        view: defaultModules.includes(p.module),
        create: defaultModules.includes(p.module) && ['inventory', 'sales', 'customers', 'users'].includes(p.module),
        edit: defaultModules.includes(p.module) && ['inventory', 'sales', 'customers'].includes(p.module),
      }
    }));
    setPermissions(updated);
    onPermissionsChange(updated);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Permission Settings</CardTitle>
          <button 
            type="button"
            onClick={applyRoleDefaults}
            className="text-sm text-primary hover:underline"
          >
            Apply Role Defaults
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(MODULES).map(([moduleKey, module]) => {
          const modulePermission = permissions.find(p => p.module === moduleKey);
          
          return (
            <div key={moduleKey} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{module.name}</h4>
                <Badge variant="outline">{moduleKey}</Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {module.permissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${moduleKey}-${permission}`}
                      checked={modulePermission?.permissions[permission as keyof typeof modulePermission.permissions] || false}
                      onCheckedChange={(checked) => 
                        updatePermission(moduleKey, permission, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`${moduleKey}-${permission}`}
                      className="text-sm capitalize"
                    >
                      {permission}
                    </Label>
                  </div>
                ))}
              </div>

              {module.hasResourceFilter && modulePermission?.permissions.view && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <Label className="text-sm font-medium">Access Level</Label>
                  <Select 
                    value={modulePermission.resourceFilter?.type || 'all'}
                    onValueChange={(value) => 
                      updateResourceFilter(moduleKey, value as 'all' | 'branch' | 'rider_specific')
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Data</SelectItem>
                      <SelectItem value="branch">Branch Only</SelectItem>
                      <SelectItem value="rider_specific">Specific Riders Only</SelectItem>
                    </SelectContent>
                  </Select>

                  {modulePermission.resourceFilter?.type === 'rider_specific' && (
                    <div className="mt-3">
                      <Label className="text-sm">Select Riders</Label>
                      <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                        {riders.map((rider) => (
                          <div key={rider.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`rider-${rider.id}`}
                              checked={modulePermission.resourceFilter?.riderIds?.includes(rider.id) || false}
                              onCheckedChange={(checked) => {
                                const currentIds = modulePermission.resourceFilter?.riderIds || [];
                                const newIds = checked 
                                  ? [...currentIds, rider.id]
                                  : currentIds.filter(id => id !== rider.id);
                                updateResourceFilter(moduleKey, 'rider_specific', newIds);
                              }}
                            />
                            <Label htmlFor={`rider-${rider.id}`} className="text-sm">
                              {rider.code} - {rider.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}