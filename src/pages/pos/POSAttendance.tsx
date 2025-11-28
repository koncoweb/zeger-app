import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AttendanceCard from '@/components/pos/AttendanceCard';

const POSAttendance = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <div className="container mx-auto p-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/pos-app/dashboard')}
            className="hover:bg-red-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Absensi</h1>
        </div>

        {/* Attendance Card */}
        <AttendanceCard />
      </div>
    </div>
  );
};

export default POSAttendance;
