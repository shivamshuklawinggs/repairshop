import { Role } from "@/types";
 // Define role-based access rules with all possible roles
  const roleAccessRules=(routeKey:string)=>{
    return  {
        [Role.ADMIN]: () => true,
        [Role.SUPERADMIN]: () => ["dashboard", "users"].includes(routeKey),
        [Role.ACCOUNTANT]: () => ["accounting"].includes(routeKey), // Accountants need menu permissions
        [Role.MANAGER]: () => false, // Sales need menu permissions
      };
      
  }

  export {roleAccessRules}