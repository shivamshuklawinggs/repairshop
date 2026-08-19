import { RootState } from '@/redux/store';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { isRole } from '.';
import { ADMIN_ASSIGNABLE_ROLES, SUPERADMIN_ASSIGNABLE_ROLES } from '@/types';

/**
 * Gets roles that the current user can assign
 */
export const getAssignableRoles = () => {
    const {user} = useSelector((state: RootState) => state.user);
   const [showRoles, setShowRoles] = useState<string[]>([]);
   useEffect(() => {
    if(isRole.isSuperAdmin(user?.role as string)) {
        setShowRoles(SUPERADMIN_ASSIGNABLE_ROLES);
    } else if(isRole.isAdmin(user?.role as string)) {
        setShowRoles(ADMIN_ASSIGNABLE_ROLES);
    }
   }, [user]);

   return showRoles;
};

export default getAssignableRoles;