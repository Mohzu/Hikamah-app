import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

// --- INTERFACE DIPERBARUI ---
interface User {
  id_pengguna: number;
  username: string;
  nama_santri?: string;
  nama_pengguna?: string;
  email?: string;
  peran: 'Admin' | 'Guru' | 'Wali Kelas' | 'Santri' | 'Wali Santri' | 'Bendahara';
  id_santri?: number;
  nama_kelas?: string | null; // Ditambahkan
  nama_jenjang?: string | null; // Ditambahkan
}

interface AuthContextType {
  user: User | null;
  login: (username: string, kata_sandi: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/status`, { withCredentials: true });
        if (response.data.success && response.data.data.loggedIn) {
          setUser(response.data.data.user);
        }
      } catch (error) {
        console.error("Gagal memeriksa status login:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  const login = async (username: string, kata_sandi: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { username, kata_sandi }, { withCredentials: true });
      if (response.data.success) {
        setUser(response.data.data.user);
        toast.success(response.data.data.message || 'Login berhasil!');
        
        console.log('[AuthContext] User role:', response.data.data.user.peran);
        console.log('[AuthContext] Redirecting user...');
        
        // Redirect based on user role
        switch (response.data.data.user.peran) {
          case 'Admin':
            console.log('[AuthContext] Redirecting to admin dashboard');
            navigate('/admin/dashboard');
            break;
          case 'Bendahara':
            console.log('[AuthContext] Redirecting to bendahara dashboard');
            navigate('/bendahara/dashboard');
            break;
          case 'Guru':
            console.log('[AuthContext] Redirecting to guru dashboard');
            navigate('/guru/dashboard');
            break;
          case 'Wali Kelas':
            console.log('[AuthContext] Redirecting wali kelas to role chooser');
            navigate('/choose-role');
            break;
          case 'Santri':
            console.log('[AuthContext] Redirecting to parent dashboard');
            navigate('/parent/dashboard');
            break;
          case 'Wali Santri':
            console.log('[AuthContext] Redirecting to parent dashboard');
            navigate('/parent/dashboard');
            break;
          default:
            console.log('[AuthContext] Redirecting to default dashboard');
            navigate('/dashboard');
        }
      } else {
        const errorMessage = response.data.error || 'Login gagal.';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Login gagal:", error);
      const errorMessage = error.response?.data?.error || 'Login gagal. Coba lagi.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      toast.success('Logout berhasil!');
      navigate('/auth/login');
    } catch (error) {
      console.error("Logout gagal:", error);
      toast.error('Logout gagal. Silakan coba lagi.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};