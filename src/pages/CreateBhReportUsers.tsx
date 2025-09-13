import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserAssignment {
  email: string;
  riderId: string;
  riderName: string;
}

const USER_ASSIGNMENTS: UserAssignment[] = [
  {
    email: 'Dyahnovita46@gmail.com',
    riderId: '529b4a9a-03c1-44de-9a62-f2c96b992409',
    riderName: 'Z-005 Pak Tri'
  },
  {
    email: 'ino_ech@yahoo.co.id',
    riderId: '32bb1648-2e2f-49cd-92fa-7221cbd1ffc5',
    riderName: 'Z-006 Pak Dhani'
  },
  {
    email: 'hisjam1@gmail.com',
    riderId: '9af42c3c-49a2-4180-8b46-f521b1a8585b',
    riderName: 'Z-010 Fajar'
  },
  {
    email: 'nurmaulidafitriasupriyadi@gmail.com',
    riderId: '6ecf02f5-27e4-4dd1-9885-a77fd12a6262',
    riderName: 'Z-013 Pak Imam'
  }
];

export const CreateBhReportUsers = () => {
  const [loading, setLoading] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);

  const createAllUsers = async () => {
    setLoading(true);
    const successfullyCreated: string[] = [];

    for (const assignment of USER_ASSIGNMENTS) {
      try {
        const { data, error } = await supabase.functions.invoke('create-bh-report-users', {
          body: {
            email: assignment.email,
            password: 'zeger1234',
            riderId: assignment.riderId,
            fullName: assignment.riderName.replace(/^Z-\d+\s/, '') // Remove code prefix
          }
        });

        if (error) {
          toast.error(`Error creating user ${assignment.email}: ${error.message}`);
        } else {
          toast.success(`User created: ${assignment.email} → ${assignment.riderName}`);
          successfullyCreated.push(assignment.email);
        }
      } catch (error: any) {
        toast.error(`Failed to create user ${assignment.email}: ${error.message}`);
      }
    }

    setCreatedUsers(successfullyCreated);
    setLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Create Branch Hub Report Users</h1>
        <p className="text-muted-foreground">
          Create users with bh_report role and assign them to specific riders
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {USER_ASSIGNMENTS.map((assignment, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{assignment.email}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Rider:</strong> {assignment.riderName}</p>
                <p><strong>Password:</strong> zeger1234</p>
                <p><strong>Role:</strong> bh_report</p>
                {createdUsers.includes(assignment.email) && (
                  <div className="text-success font-medium">✓ Created successfully</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={createAllUsers}
          disabled={loading}
          size="lg"
        >
          {loading ? 'Creating Users...' : 'Create All Users'}
        </Button>
        
        {createdUsers.length > 0 && (
          <div className="text-success font-medium flex items-center">
            ✓ {createdUsers.length}/{USER_ASSIGNMENTS.length} users created
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. Click "Create All Users" to create all BH Report users at once</p>
            <p>2. Each user will be assigned to their specific rider automatically</p>
            <p>3. Users can login with their email and password "zeger1234"</p>
            <p>4. They will see only data for their assigned rider</p>
            <p>5. Available features: Dashboard, Transactions, Transaction Details, Profit Loss, Cash Flow</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};