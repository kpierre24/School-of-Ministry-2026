import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'student' | 'teacher')[];
}

export const RoleGate: React.FC<RoleGateProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  // Placeholder logic, role needs to be determined from user profile
  const userRole = user?.role || 'student'; 

  if (!allowedRoles.includes(userRole as any)) {
    return <div>Unauthorized</div>;
  }

  return <>{children}</>;
};
