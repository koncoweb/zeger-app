import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { ZegerLogo } from '@/components/ui/zeger-logo';

// Zod schema untuk validasi form login
const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

// Zod schema untuk validasi form register
const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  fullName: z.string().min(3, 'Nama minimal 3 karakter'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  role: z.enum(['bh_kasir', 'sb_kasir', '2_Hub_Kasir', '3_SB_Kasir']),
  branchId: z.string().min(1, 'Pilih branch'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface Branch {
  id: string;
  name: string;
  code: string;
  branch_type: string;
}

export const POSAuth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeTab, setActiveTab] = useState<string>('login');

  // Form untuk login
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: errorsLogin },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Form untuk register
  const {
    register: registerForm,
    handleSubmit: handleSubmitRegister,
    formState: { errors: errorsRegister },
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Fetch branches untuk dropdown
  useEffect(() => {
    const fetchBranches = async () => {
      console.log('Fetching branches...');
      try {
        const { data, error } = await supabase
          .from('branches')
          .select('id, name, code, branch_type')
          .eq('is_active', true)
          .order('branch_type')
          .order('name');

        if (error) {
          console.error('Error fetching branches:', error);
          setError(`Gagal memuat data branch: ${error.message}`);
        } else if (data) {
          console.log('Branches loaded:', data);
          setBranches(data);
          if (data.length === 0) {
            console.warn('No active branches found in database');
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching branches:', err);
      }
    };

    fetchBranches();
  }, []);

  const onLogin = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Sign in dengan Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Login gagal');
      }

      // Fetch user profile untuk check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, branch_id, is_active')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // Check apakah user adalah kasir
      const kasirRoles = ['bh_kasir', 'sb_kasir', '2_Hub_Kasir', '3_SB_Kasir'];
      if (!kasirRoles.includes(profile.role)) {
        // Sign out jika bukan kasir
        await supabase.auth.signOut();
        throw new Error('Akses ditolak. Hanya kasir yang dapat menggunakan aplikasi POS.');
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error('Akun Anda tidak aktif. Hubungi administrator.');
      }

      // Redirect ke dashboard POS
      navigate('/pos-app/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Sign up dengan Supabase Auth dengan metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            role: data.role,
            branch_id: data.branchId,
            app_access_type: 'pos_app',
          },
          emailRedirectTo: undefined, // Prevent email confirmation redirect
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Registrasi gagal');
      }

      const userId = authData.user.id;

      // Sign out immediately to prevent auth state change from triggering profile fetch
      // Use local scope to avoid triggering SIGNED_OUT event globally
      await supabase.auth.signOut({ scope: 'local' });

      // Wait for trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update profile with correct data
      let retries = 5;
      let updateSuccess = false;
      
      while (retries > 0 && !updateSuccess) {
        try {
          // Check if profile exists first
          const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
          }

          if (existingProfile) {
            // Profile exists, update it
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                role: data.role,
                branch_id: data.branchId,
                full_name: data.fullName,
                phone: data.phone,
                app_access_type: 'pos_app',
              })
              .eq('user_id', userId);

            if (!updateError) {
              updateSuccess = true;
              console.log('Profile updated successfully');
            } else {
              throw updateError;
            }
          } else if (retries > 1) {
            // Profile doesn't exist yet, wait and retry
            console.log(`Profile not created yet, waiting... (${retries - 1} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw new Error('Profile creation timeout');
          }
        } catch (err) {
          if (retries === 1) {
            console.error('Error updating profile after retries:', err);
            // Don't throw, registration was successful even if update failed
          }
        }
        retries--;
      }

      setSuccess('Registrasi berhasil! Silakan login dengan akun Anda.');
      setActiveTab('login');
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Terjadi kesalahan saat registrasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-red-100">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
              <ZegerLogo className="w-16 h-16 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-red-600">
            Zeger POS
          </CardTitle>
          <CardDescription className="text-base">
            Sistem kasir karyawan branch
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(error || success) && (
            <Alert variant={error ? "destructive" : "default"} className={error ? "bg-red-50 border-red-200 mb-4" : "bg-green-50 border-green-200 mb-4"}>
              <AlertDescription className={error ? "text-red-800" : "text-green-800"}>
                {error || success}
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Tab Login */}
            <TabsContent value="login">
              <form onSubmit={handleSubmitLogin(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="kasir@zeger.id"
                    {...registerLogin('email')}
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                    disabled={loading}
                  />
                  {errorsLogin.email && (
                    <p className="text-sm text-red-600">{errorsLogin.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    {...registerLogin('password')}
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                    disabled={loading}
                  />
                  {errorsLogin.password && (
                    <p className="text-sm text-red-600">{errorsLogin.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-6 text-lg shadow-md transition-all duration-200 hover:shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Tab Register */}
            <TabsContent value="register">
              <form onSubmit={handleSubmitRegister(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="kasir@zeger.id"
                    {...registerForm('email')}
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                    disabled={loading}
                  />
                  {errorsRegister.email && (
                    <p className="text-sm text-red-600">{errorsRegister.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    {...registerForm('password')}
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                    disabled={loading}
                  />
                  {errorsRegister.password && (
                    <p className="text-sm text-red-600">{errorsRegister.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-fullName" className="text-gray-700">
                    Nama Lengkap
                  </Label>
                  <Input
                    id="register-fullName"
                    type="text"
                    placeholder="Nama Kasir"
                    {...registerForm('fullName')}
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                    disabled={loading}
                  />
                  {errorsRegister.fullName && (
                    <p className="text-sm text-red-600">{errorsRegister.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-phone" className="text-gray-700">
                    Nomor Telepon
                  </Label>
                  <Input
                    id="register-phone"
                    type="tel"
                    placeholder="081234567890"
                    {...registerForm('phone')}
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                    disabled={loading}
                  />
                  {errorsRegister.phone && (
                    <p className="text-sm text-red-600">{errorsRegister.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-role" className="text-gray-700">
                    Role Kasir
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('role', value as any)}
                    disabled={loading}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                      <SelectValue placeholder="Pilih role kasir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bh_kasir">Hub Branch Kasir</SelectItem>
                      <SelectItem value="sb_kasir">Small Branch Kasir</SelectItem>
                      <SelectItem value="2_Hub_Kasir">Hub Kasir (Level 2)</SelectItem>
                      <SelectItem value="3_SB_Kasir">Small Branch Kasir (Level 3)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errorsRegister.role && (
                    <p className="text-sm text-red-600">{errorsRegister.role.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-branchId" className="text-gray-700">
                    Branch {branches.length > 0 && `(${branches.length} tersedia)`}
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('branchId', value)}
                    disabled={loading || branches.length === 0}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                      <SelectValue placeholder={branches.length === 0 ? "Loading branches..." : "Pilih branch"} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.length === 0 ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name} ({branch.code})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errorsRegister.branchId && (
                    <p className="text-sm text-red-600">{errorsRegister.branchId.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-6 text-lg shadow-md transition-all duration-200 hover:shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Daftar'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Aplikasi POS Karyawan Branch</p>
            <p className="mt-1">© 2024 Zeger Coffee</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
