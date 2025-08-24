import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

export const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        `flex items-center space-x-3 p-3 rounded-md transition-colors duration-200 ` +
        (isActive ? 'bg-teal-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100')
      }
    >
      {icon}
      <span className="font-medium">{label}</span>
    </NavLink>
  );
};