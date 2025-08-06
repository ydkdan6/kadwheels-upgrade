import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import OnboardingModal from '@/components/OnboardingModal';
import AuthModal from '@/components/AuthModal';
import BookingModal from '@/components/BookingModal';
import { Bus, Bell, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUpcomingReservations();
      fetchNotifications();
    }
  }, [user]);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (!hasLaunched) {
        setShowOnboarding(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
    }
  };

  const fetchUpcomingReservations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          buses (
            *,
            routes (*)
          )
        `)
        .eq('user_id', user.id)
        .eq('booking_status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setUpcomingReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const fetchNotifications = async () => {
  try {
    const { data, error } = await supabase
      .from('user_notifications') // Use the view for better performance
      .select('*')
      .or(`target_users.cs.{${user.id}},target_users.is.null`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    setNotifications(data || []);
    
    // Get unread count
    const { data: unreadCount } = await supabase
      .rpc('get_unread_notification_count', { user_id: user.id });
    
    // Update your notification badge with unreadCount
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
};

// Function to mark notification as read
// const markAsRead = async (notificationId) => {
//   try {
//     const { data, error } = await supabase
//       .rpc('mark_notification_read', {
//         notification_id: notificationId,
//         user_id: user.id
//       });
    
//     if (error) throw error;
//     // Refresh notifications
//     fetchNotifications();
//   } catch (error) {
//     console.error('Error marking notification as read:', error);
//   }
// };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUpcomingReservations(),
      fetchNotifications(),
    ]);
    setRefreshing(false);
  };

  const handleBookBus = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setShowBooking(true);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {user ? `Welcome, ${profile?.full_name || 'Student'}!` : 'Welcome to Kaduna Poly Bus'}
            </Text>
            <Text style={styles.subGreeting}>
              {user ? 'Ready for your next journey?' : 'Sign in to book your bus ticket'}
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color={Colors.white} />
            {notifications.length > 0 && <View style={styles.notificationBadge} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.bookButton} onPress={handleBookBus}>
          <Plus size={24} color={Colors.white} />
          <Text style={styles.bookButtonText}>Book a Bus for ₦500</Text>
        </TouchableOpacity>

        {user && upcomingReservations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Reservations</Text>
            {upcomingReservations.map((reservation: any) => (
              <View key={reservation.id} style={styles.reservationCard}>
                <View style={styles.reservationHeader}>
                  <Bus size={20} color={Colors.accent} />
                  <Text style={styles.reservationRoute}>
                    {reservation.buses.routes.origin} → {reservation.buses.routes.destination}
                  </Text>
                </View>
                <View style={styles.reservationDetails}>
                  <Text style={styles.reservationTime}>
                    {formatDate(reservation.buses.date)} • {(reservation.buses.departure_time)}
                  </Text>
                  <Text style={styles.reservationSeat}>Seat {reservation.seat_number}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {user && notifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            {notifications.slice(0, 3).map((notification: any) => (
              <View key={notification.id} style={styles.notificationCard}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>
                  {formatDate(notification.created_at)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!user && (
          <View style={styles.authPrompt}>
            <Text style={styles.authPromptTitle}>Get Started</Text>
            <Text style={styles.authPromptText}>
              Sign in to book buses, view your tickets, and receive notifications
            </Text>
            <TouchableOpacity
              style={styles.authPromptButton}
              onPress={() => setShowAuth(true)}
            >
              <Text style={styles.authPromptButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <OnboardingModal
        visible={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      <AuthModal
        visible={showAuth}
        onClose={() => setShowAuth(false)}
      />

      <BookingModal
        visible={showBooking}
        onClose={() => setShowBooking(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  bookButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginBottom: 16,
  },
  reservationCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  reservationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reservationRoute: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    marginLeft: 8,
  },
  reservationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reservationTime: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
  },
  reservationSeat: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.accent,
  },
  notificationCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  notificationTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
  },
  authPrompt: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  authPromptTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginBottom: 8,
  },
  authPromptText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  authPromptButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authPromptButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
});