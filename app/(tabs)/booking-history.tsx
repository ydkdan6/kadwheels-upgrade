import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { History, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import TicketModal from '@/components/TicketModal';

export default function BookingHistoryScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicket, setShowTicket] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const handleBookingPress = (booking: any) => {
    if (booking.booking_status !== 'expired') {
      setSelectedTicket(booking);
      setShowTicket(true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} color={Colors.success} />;
      case 'used':
        return <CheckCircle size={16} color={Colors.accent} />;
      case 'expired':
        return <XCircle size={16} color={Colors.error} />;
      case 'cancelled':
        return <XCircle size={16} color={Colors.error} />;
      default:
        return <Clock size={16} color={Colors.warning} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'used':
        return 'Used';
      case 'expired':
        return 'Expired';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return Colors.success;
      case 'used':
        return Colors.accent;
      case 'expired':
        return Colors.error;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.warning;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <History size={64} color={Colors.darkGray} />
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>
            Please sign in to view your booking history
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking History</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading bookings...</Text>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <History size={64} color={Colors.darkGray} />
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptyText}>
              Your booking history will appear here after you make your first reservation
            </Text>
          </View>
        ) : (
          bookings.map((booking: any) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => handleBookingPress(booking)}
              disabled={booking.booking_status === 'expired'}
            >
              <View style={styles.bookingHeader}>
                <Text style={styles.routeText}>
                  {booking.buses.routes.origin} → {booking.buses.routes.destination}
                </Text>
                <View style={styles.statusContainer}>
                  {getStatusIcon(booking.booking_status)}
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(booking.booking_status) }
                  ]}>
                    {getStatusText(booking.booking_status)}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(booking.buses.date)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(booking.buses.departure_time)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Seat:</Text>
                  <Text style={styles.detailValue}>#{booking.seat_number}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>₦{booking.amount_paid}</Text>
                </View>
              </View>

              <Text style={styles.bookingDate}>
                Booked on {formatDate(booking.created_at)}
              </Text>

              {booking.booking_status === 'expired' && (
                <Text style={styles.expiredLabel}>EXPIRED</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TicketModal
        visible={showTicket}
        ticket={selectedTicket}
        onClose={() => setShowTicket(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    textAlign: 'center',
    marginTop: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bookingCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginLeft: 4,
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  bookingDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
  },
  expiredLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: Colors.error,
    textAlign: 'right',
    marginTop: 8,
  },
});