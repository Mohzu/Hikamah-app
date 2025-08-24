import React from 'react';
import type { LucideProps } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface IconProps extends LucideProps {
  // Ubah tipe prop menjadi LucideIcon
  IconComponent: LucideIcon;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ IconComponent, className, ...props }) => {
  // Render komponen ikon secara langsung
  return <IconComponent className={className} {...props} />;
};