import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

interface User {
  id_pengguna: number;
  username: string;
  nama_santri?: string;
  nama_pengguna?: string;
  peran: 'Admin' | 'Guru' | 'Santri' | 'Wali Santri';
  id_santri?: number;
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
        if (response.data.data.user.peran === 'Santri') {
          navigate('/parent/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(response.data.error || 'Login gagal.');
      }
    } catch (error: any) {
      console.error("Login gagal:", error);
      toast.error(error.response?.data?.error || 'Login gagal. Coba lagi.');
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