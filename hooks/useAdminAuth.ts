import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminUser {
  id: string;
  email: string;
  isAdmin: boolean;
}


const ADMIN_CREDENTIALS = {
  email: 'admin@kadunapoly.edu.ng',
  password: 'admin123',
};

export function useAdminAuth() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      const adminSession = await AsyncStorage.getItem('adminSession');
      if (adminSession) {
        const user = JSON.parse(adminSession);
        setAdminUser(user);
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Validate admin credentials
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const adminUser: AdminUser = {
          id: 'admin-001',
          email: email,
          isAdmin: true,
        };

        // Store admin session
        await AsyncStorage.setItem('adminSession', JSON.stringify(adminUser));
        setAdminUser(adminUser);
        
        return { data: adminUser, error: null };
      } else {
        return { data: null, error: { message: 'Invalid admin credentials' } };
      }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Sign in failed' } };
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('adminSession');
      setAdminUser(null);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Sign out failed' } };
    }
  };

  return {
    adminUser,
    loading,
    signIn,
    signOut,
  };
}