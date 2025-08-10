import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Add structuredClone polyfill at the top
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = function(obj: any) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (Array.isArray(obj)) {
      return obj.map(item => globalThis.structuredClone(item));
    }
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = globalThis.structuredClone(obj[key]);
      }
    }
    return cloned;
  };
}

// Admin access codes from environment variables
const ADMIN_ACCESS_CODES = ['ADMIN_2024_SECURE', 'MASTER_KEY_2024', 'SUPER_ADMIN_ACCESS'];

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Function to send welcome notification
  const sendWelcomeNotification = async (userId: string, fullName: string) => {
    try {
      console.log('Sending welcome notification to:', userId, fullName);
      
      const { data, error } = await supabase
        .rpc('send_welcome_notification', {
          user_id: userId,
          user_name: fullName || 'Student'
        });

      if (error) {
        console.warn('Failed to send welcome notification:', error);
        // Don't throw error - notification failure shouldn't break signup
        return null;
      }

      console.log('Welcome notification sent successfully:', data);
      return data;
    } catch (error) {
      console.warn('Error sending welcome notification:', error);
      // Don't throw error - notification failure shouldn't break signup
      return null;
    }
  };

  // Function to safely create or update profile
  const createOrUpdateProfile = async (userId: string, email: string, fullName: string, sendNotification: boolean = false) => {
    try {
      // First, try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error fetching existing profile:', fetchError);
        throw fetchError;
      }

      if (existingProfile) {
        // Profile exists, update it if necessary
        console.log('Profile exists, updating if needed');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email,
            full_name: fullName,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }

        return existingProfile;
      } else {
        // Profile doesn't exist, create it
        console.log('Creating new profile');
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email,
            full_name: fullName,
            role: 'student',
            is_admin: false,
          })
          .select()
          .single();

        if (insertError) {
          // Handle duplicate key error gracefully
          if (insertError.code === '23505') {
            console.log('Profile already exists (race condition), fetching existing profile');
            const { data: existingProfile, error: refetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();

            if (refetchError) {
              console.error('Error refetching profile after duplicate key:', refetchError);
              throw refetchError;
            }

            return existingProfile;
          }
          
          console.error('Error creating profile:', insertError);
          throw insertError;
        }

        // Send welcome notification for new profiles only
        if (newProfile && sendNotification) {
          await sendWelcomeNotification(userId, fullName);
        }

        return newProfile;
      }
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
      throw error;
    }
  };

  // Function to check if user is admin and get full profile
  const checkUserProfile = async (userId: string) => {
    try {
      console.log('Checking user profile for:', userId);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking user profile:', error);
        return { isAdmin: false, profile: null };
      }

      console.log('User profile data:', profile);
      console.log('is_admin value:', profile?.is_admin);
      console.log('role value:', profile?.role);

      const adminStatus = profile?.is_admin === true || profile?.role === 'admin';
      console.log('Calculated admin status:', adminStatus);

      return { isAdmin: adminStatus, profile };
    } catch (error) {
      console.error('Error in checkUserProfile:', error);
      return { isAdmin: false, profile: null };
    }
  };

  // Function to validate admin access code
  const validateAdminCode = (code: string): boolean => {
    console.log('Validating code:', code);
    console.log('Against codes:', ADMIN_ACCESS_CODES);
    const isValid = ADMIN_ACCESS_CODES.includes(code);
    console.log('Validation result:', isValid);
    return isValid;
  };

  // Function to promote user to admin
  const promoteToAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_admin: true, 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error promoting user to admin:', error);
        return false;
      }

      // Send admin promotion notification
      try {
        await supabase.rpc('send_notification_to_users', {
          p_title: 'Admin Access Granted! 👑',
          p_message: 'You now have administrator privileges. Welcome to the admin panel!',
          p_type: 'success',
          p_target_users: [userId]
        });
      } catch (notificationError) {
        console.warn('Failed to send admin promotion notification:', notificationError);
      }

      return true;
    } catch (error) {
      console.error('Error in promoteToAdmin:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          
          // Check admin status if user exists
          if (session?.user) {
            console.log('User found in session:', session.user.email);
            const { isAdmin: adminStatus, profile: userProfile } = await checkUserProfile(session.user.id);
            setIsAdmin(adminStatus);
            setProfile(userProfile);
            console.log('Set isAdmin to:', adminStatus);
          } else {
            console.log('No user in session');
            setIsAdmin(false);
            setProfile(null);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (mounted) {
          setUser(session?.user ?? null);
          
          // Check admin status when user signs in
          if (session?.user) {
            console.log('User signed in, checking profile...');
            const { isAdmin: adminStatus, profile: userProfile } = await checkUserProfile(session.user.id);
            setIsAdmin(adminStatus);
            setProfile(userProfile);
            console.log('Auth change - set isAdmin to:', adminStatus);
          } else {
            console.log('User signed out');
            setIsAdmin(false);
            setProfile(null);
          }
          
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        setLoading(false);
        return { data, error };
      }

      // Only create profile if user was successfully created
      if (data.user && data.user.id) {
        try {
          // Pass sendNotification: true for new signups
          const profile = await createOrUpdateProfile(data.user.id, data.user.email!, fullName, true);
          console.log('Profile created/updated successfully:', profile);
          
          // Update local state with new profile
          setProfile(profile);
        } catch (profileError) {
          console.error('Profile creation/update failed:', profileError);
          // Don't fail the signup if profile creation fails
          // The profile will be created on next login attempt
        }
      }

      setLoading(false);
      return { data, error };
    } catch (error) {
      console.error('Signup failed:', error);
      setLoading(false);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      // If sign in is successful but we don't have a profile, create one
      if (result.data.user && !result.error) {
        try {
          const { isAdmin: adminStatus, profile: userProfile } = await checkUserProfile(result.data.user.id);
          
          if (!userProfile) {
            // Create profile if it doesn't exist (don't send notification for existing users)
            console.log('Creating missing profile for existing user');
            const profile = await createOrUpdateProfile(
              result.data.user.id, 
              result.data.user.email!, 
              result.data.user.user_metadata?.full_name || 'User',
              false // Don't send notification for existing users
            );
            setProfile(profile);
          } else {
            setProfile(userProfile);
          }
          
          setIsAdmin(adminStatus);
        } catch (profileError) {
          console.error('Profile check/creation failed during sign in:', profileError);
        }
      }
      
      setLoading(false);
      return result;
    } catch (error) {
      console.error('Sign in failed:', error);
      setLoading(false);
      return { data: { user: null, session: null }, error };
    }
  };

  const signInAdmin = async (email: string, password: string, adminCode: string) => {
    try {
      setLoading(true);
      
      // First validate the admin code
      if (!validateAdminCode(adminCode)) {
        setLoading(false);
        return { 
          data: { user: null, session: null }, 
          error: { message: 'Invalid admin access code' } 
        };
      }

      // Attempt to sign in with email and password
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      if (result.error) {
        setLoading(false);
        return result;
      }

      if (result.data.user) {
        // Ensure profile exists first
        try {
          const { isAdmin: currentAdminStatus, profile: userProfile } = await checkUserProfile(result.data.user.id);
          
          if (!userProfile) {
            // Create profile if it doesn't exist
            console.log('Creating missing profile for admin user');
            const profile = await createOrUpdateProfile(
              result.data.user.id, 
              result.data.user.email!, 
              result.data.user.user_metadata?.full_name || 'Admin User',
              false // Don't send welcome notification for admin users
            );
            setProfile(profile);
          } else {
            setProfile(userProfile);
          }

          if (!currentAdminStatus) {
            // Promote user to admin since they provided valid admin code
            const promotionSuccess = await promoteToAdmin(result.data.user.id);
            
            if (!promotionSuccess) {
              setLoading(false);
              return { 
                data: { user: null, session: null }, 
                error: { message: 'Failed to grant admin privileges' } 
              };
            }
            
            // Refresh the profile data after promotion
            const { isAdmin: newAdminStatus, profile: newProfile } = await checkUserProfile(result.data.user.id);
            setIsAdmin(newAdminStatus);
            setProfile(newProfile);
            
            // Navigate to admin screen
            // if (newAdminStatus) {
            //   console.log('Attempting navigation to admin screen');
            //   setTimeout(() => {
            //     router.push('/admin');
            //   }, 100);
            // }
          } else {
            // User is already admin
            setIsAdmin(currentAdminStatus);
            setProfile(userProfile);
            
            // Navigate to admin screen
            console.log('User is already admin, navigating...');
            // setTimeout(() => {
            //   router.push('/admin');
            // }, 100);
          }
        } catch (profileError) {
          console.error('Profile handling failed during admin sign in:', profileError);
          setLoading(false);
          return { 
            data: { user: null, session: null }, 
            error: { message: 'Failed to handle user profile' } 
          };
        }
      }

      setLoading(false);
      return result;
    } catch (error) {
      console.error('Admin sign in failed:', error);
      setLoading(false);
      return { 
        data: { user: null, session: null }, 
        error: { message: 'Admin sign in failed' } 
      };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setIsAdmin(false);
      setProfile(null);
      const result = await supabase.auth.signOut();
      setLoading(false);
      return result;
    } catch (error) {
      console.error('Sign out failed:', error);
      setLoading(false);
      return { error };
    }
  };

  // Function to refresh admin status manually
  const refreshAdminStatus = async () => {
    if (user) {
      const { isAdmin: adminStatus, profile: userProfile } = await checkUserProfile(user.id);
      setIsAdmin(adminStatus);
      setProfile(userProfile);
      return adminStatus;
    }
    return false;
  };

  // Function to send custom notification (useful for admin features)
  const sendNotification = async (title: string, message: string, targetUsers?: string[], type: string = 'info') => {
    try {
      const { data, error } = await supabase.rpc('send_notification_to_users', {
        p_title: title,
        p_message: message,
        p_type: type,
        p_target_users: targetUsers || null,
        p_route_id: null,
        p_bus_id: null,
        p_sent_by: user?.id || null
      });

      if (error) {
        console.error('Error sending notification:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in sendNotification:', error);
      return { success: false, error };
    }
  };

  // Navigation helper functions
  const navigateToAdmin = () => {
    try {
      router.push('/admin');
    } catch (error) {
      console.log('Navigation to /admin failed, trying alternative');
      // router.push('/(tab)/admin');
    }
  };

  const navigateToHome = () => {
    router.replace('/');
  };

  return {
    user,
    loading,
    isAdmin,
    profile,
    signUp,
    signIn,
    signInAdmin,
    signOut,
    refreshAdminStatus,
    sendNotification,
    navigateToAdmin,
    navigateToHome,
  };
}