import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminContextType {
  adminCode: string | null;
  isAdmin: boolean;
  login: (code: string) => void;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType>({
  adminCode: null,
  isAdmin: false,
  login: () => {},
  logout: () => {},
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminCode, setAdminCode] = useState<string | null>(() => {
    return localStorage.getItem('adminCode');
  });

  const login = (code: string) => {
    setAdminCode(code);
    localStorage.setItem('adminCode', code);
  };

  const logout = () => {
    setAdminCode(null);
    localStorage.removeItem('adminCode');
  };

  return (
    <AdminContext.Provider value={{ adminCode, isAdmin: adminCode === '0107', login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
