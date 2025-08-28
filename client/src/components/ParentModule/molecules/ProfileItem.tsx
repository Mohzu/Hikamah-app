// client/src/components/ParentModule/molecules/ProfileItem.tsx
import React from 'react';

interface ProfileItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

export const ProfileItem: React.FC<ProfileItemProps> = ({ icon, label, value }) => {
  return (
    <div className="flex items-center space-x-4">
      {icon}
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-base font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
};