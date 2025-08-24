import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Smartphone, Hash, MapPin, Briefcase } from 'lucide-react';
import { ProfileItem } from '../molecules/ProfileItem';

// Menambahkan interfaces untuk mendefinisikan struktur data
interface SantriData {
  nama_lengkap: string;
  nis: string;
  jenis_kelamin: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  status: string;
  no_telp: string;
}

interface ParentData {
  nama_lengkap?: string;
  nama_ayah?: string;
  nama_ibu?: string;
  pekerjaan_ayah?: string;
  pekerjaan_ibu?: string;
  no_telp_ayah?: string;
  no_telp_ibu?: string;
}

interface ProfileData {
  santri: SantriData;
  ayah: ParentData;
  ibu: ParentData;
}

export function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/account/santri/profile`, { withCredentials: true });
        if (response.data && response.data.success) {
          setProfileData(response.data.data);
        } else {
          setError('Gagal mengambil data profil.');
        }
      } catch (err) {
        console.error("Kesalahan saat mengambil data profil:", err);
        setError('Gagal terhubung ke server.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
        <div className="p-4 text-center">Memuat data profil...</div>
    );
  }
  if (error || !profileData) {
    return (
        <div className="p-4 text-center text-red-500">{error || "Data profil tidak ditemukan."}</div>
    );
  }

  const { santri, ayah, ibu } = profileData;

  // Mendefinisikan tipe data untuk parameter fungsi
  const renderProfileSection = (title: string, data: any, iconMap: { [key: string]: React.ReactNode }) => (
    <div className="bg-white shadow-lg rounded-xl p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(data).map(([key, value]) => (
          <ProfileItem
            key={key}
            icon={iconMap[key] || <User size={20} className="text-gray-500" />}
            label={key.replace(/_/g, ' ')}
            // Memastikan nilai adalah string atau number
            value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
          />
        ))}
      </div>
    </div>
  );

  const santriIconMap = {
    'nama_lengkap': <User size={20} className="text-gray-500" />,
    'nis': <Hash size={20} className="text-gray-500" />,
    'alamat': <MapPin size={20} className="text-gray-500" />,
    'no_telp': <Smartphone size={20} className="text-gray-500" />,
  };
  
  const parentIconMap = {
    'nama_lengkap': <User size={20} className="text-gray-500" />,
    'pekerjaan': <Briefcase size={20} className="text-gray-500" />,
    'no_telp': <Smartphone size={20} className="text-gray-500" />,
  };
  
  return (
      <div className="p-4 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Profil Santri & Wali</h1>
        {santri && renderProfileSection("Data Santri", santri, santriIconMap)}
        {ayah && renderProfileSection("Data Ayah", ayah, parentIconMap)}
        {ibu && renderProfileSection("Data Ibu", ibu, parentIconMap)}
      </div>
  );
}