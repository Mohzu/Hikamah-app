// client/src/components/ParentModule/organisms/ProfileSection.tsx

import React from 'react';
import { User, Smartphone, MapPin, Briefcase, UserCheck, Hash, Calendar } from 'lucide-react';
import { ProfileItem } from '../molecules/ProfileItem';

interface ProfileSectionProps {
  title: string;
  data: any;
  iconColor: string;
  bgGradient: string;
}

// Fungsi helper untuk memformat tanggal
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const ProfileSection: React.FC<ProfileSectionProps> = ({ title, data, iconColor, bgGradient }) => {
  return (
    <div className={`bg-gradient-to-br ${bgGradient} rounded-2xl p-8 shadow-lg border border-white/20 backdrop-blur-sm`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 ${iconColor} rounded-xl flex items-center justify-center`}>
          <User size={24} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(data).map(([key, value]) => {
          let icon;
          let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          let displayValue = String(value || '-');

          switch (key) {
            case 'nama_lengkap':
            case 'nama_ayah':
            case 'nama_ibu':
              icon = <User size={20} className="text-gray-600" />;
              break;
            case 'pekerjaan':
              icon = <Briefcase size={20} className="text-gray-600" />;
              break;
            case 'nomor_hp':
              icon = <Smartphone size={20} className="text-gray-600" />;
              break;
            case 'pendidikan_terakhir':
              icon = <UserCheck size={20} className="text-gray-600" />;
              label = 'Pendidikan Terakhir';
              break;
            case 'alamat':
              icon = <MapPin size={20} className="text-gray-600" />;
              break;
            case 'nomor_induk':
            case 'nisn':
              icon = <Hash size={20} className="text-gray-600" />;
              break;
            case 'jenis_kelamin':
              icon = <UserCheck size={20} className="text-gray-600" />;
              displayValue = value === 'L' ? 'Laki-laki' : 'Perempuan';
              break;
            case 'tanggal_lahir':
              icon = <Calendar size={20} className="text-gray-600" />;
              displayValue = formatDate(String(value));
              break;
            default:
              icon = <User size={20} className="text-gray-600" />;
          }

          return (
            <ProfileItem
              key={key}
              icon={icon}
              label={label}
              value={displayValue}
            />
          );
        })}
      </div>
    </div>
  );
};