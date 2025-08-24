import React from 'react';
import { Icon } from '../atoms/Icon';
import type { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  // Ubah tipe prop 'icon' menjadi LucideIcon
  icon: LucideIcon;
  title: string;
  value: string | number;
  color: "orange" | "teal" | "blue" | "green";
}

const colorMap = {
  orange: "bg-orange-50 text-orange-600 border-orange-200",
  teal: "bg-teal-50 text-teal-600 border-teal-200",
  blue: "bg-blue-50 text-blue-600 border-blue-200",
  green: "bg-green-50 text-green-600 border-green-200",
};

export const InfoCard: React.FC<InfoCardProps> = ({ icon, title, value, color }) => {
  return (
    <div className={`rounded-3xl shadow-md p-6 border ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <Icon IconComponent={icon} className={colorMap[color]} size={28} />
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};