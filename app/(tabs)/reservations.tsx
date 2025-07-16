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
import { Calendar, Clock, MapPin, Eye } from 'lucide-react-native';
import TicketModal from '@/components/TicketModal';

export default function ReservationsScreen() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicket, setShowTicket] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
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
        .eq('payment_status', 'completed')
        .in('ticket_status', ['active', 'used'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReservations();
    setRefreshing(false);
  };

  const handleViewTicket = (reservation: any) => {
    setSelectedTicket(reservation);
    setShowTicket(true);
  };

  const isActive = (reservation: any) => {
    const now = new Date();
    const expiresAt = new Date(reservation.expires_at);
    return reservation.booking_status === 'active' && expiresAt > now;
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Calendar size={64} color={Colors.darkGray} />
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>
            Please sign in to view your reservations
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reservations</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading reservations...</Text>
        ) : reservations.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color={Colors.darkGray} />
            <Text style={styles.emptyTitle}>No Reservations</Text>
            <Text style={styles.emptyText}>
              Your current and past reservations will appear here
            </Text>
          </View>
        ) : (
          <>
            {/* Active Reservations */}
            {reservations.filter(isActive).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Reservations</Text>
                {reservations.filter(isActive).map((reservation: any) => (
                  <View key={reservation.id} style={styles.reservationCard}>
                    <View style={styles.reservationHeader}>
                      <MapPin size={20} color={Colors.accent} />
                      <Text style={styles.routeText}>
                        {reservation.buses.routes.origin} → {reservation.buses.routes.destination}
                      </Text>
                      <View style={styles.activeIndicator}>
                        <Text style={styles.activeText}>ACTIVE</Text>
                      </View>
                    </View>

                    <View style={styles.reservationDetails}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Calendar size={16} color={Colors.lightGray} />
                          <Text style={styles.detailText}>
                            {formatDate(reservation.travel_date)}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Clock size={16} color={Colors.lightGray} />
                          <Text style={styles.detailText}>
                            {formatTime(reservation.buses?.departure_time)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.seatPriceRow}>
                        <Text style={styles.seatText}>
                          Seat #{reservation.seat_number}
                        </Text>
                        <Text style={styles.priceText}>
                          ₦{reservation.amount_paid}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.viewTicketButton}
                      onPress={() => handleViewTicket(reservation)}
                    >
                      <Eye size={16} color={Colors.white} />
                      <Text style={styles.viewTicketText}>View Ticket</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Past Reservations */}
            {reservations.filter(r => !isActive(r)).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past Reservations</Text>
                {reservations.filter(r => !isActive(r)).map((reservation: any) => (
                  <View key={reservation.id} style={styles.reservationCard}>
                    <View style={styles.reservationHeader}>
                      <MapPin size={20} color={Colors.lightGray} />
                      <Text style={styles.routeTextPast}>
                        {reservation.buses.routes.origin} → {reservation.buses.routes.destination}
                      </Text>
                      <View style={styles.pastIndicator}>
                        <Text style={styles.pastText}>
                          {reservation.booking_status === 'used' ? 'USED' : 'EXPIRED'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.reservationDetails}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Calendar size={16} color={Colors.lightGray} />
                          <Text style={styles.detailTextPast}>
                            {formatDate(reservation.buses?.date)}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Clock size={16} color={Colors.lightGray} />
                          <Text style={styles.detailTextPast}>
                            {formatTime(reservation.buses?.departure_time)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.seatPriceRow}>
                        <Text style={styles.seatTextPast}>
                          Seat #{reservation.seat_number}
                        </Text>
                        <Text style={styles.priceTextPast}>
                          ₦{reservation.amount_paid}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.reservationDate}>
                      Reserved on {formatDateTime(reservation.created_at)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
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
  section: {
    marginBottom: 30,
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  reservationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    flex: 1,
    marginLeft: 8,
  },
  routeTextPast: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.lightGray,
    flex: 1,
    marginLeft: 8,
  },
  activeIndicator: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeText: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  pastIndicator: {
    backgroundColor: Colors.darkGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pastText: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    color: Colors.lightGray,
  },
  reservationDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    marginLeft: 6,
  },
  detailTextPast: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.darkGray,
    marginLeft: 6,
  },
  seatPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seatText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.accent,
  },
  seatTextPast: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.darkGray,
  },
  priceText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.accent,
  },
  priceTextPast: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.darkGray,
  },
  viewTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewTicketText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    marginLeft: 6,
  },
  reservationDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.darkGray,
  },
});