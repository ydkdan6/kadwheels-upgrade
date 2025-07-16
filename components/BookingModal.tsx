import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { ROUTES, DEFAULT_PRICE } from '@/constants/Routes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { X, MapPin, Calendar, Clock, Users } from 'lucide-react-native';
import SeatSelectionModal from './SeatSelectionModal';
import PaymentModal from './PaymentModal';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  price: number;
}

interface Bus {
  id: string;
  route_id: string;
  departure_time: string;
  arrival_time: string;
  date: string;
  available_seats: number;
  capacity: number;
  bus_number: string;
  status: string;
  routes: Route;
}

export default function BookingModal({ visible, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'route' | 'schedule' | 'seat' | 'payment'>('route');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchRoutes();
    }
  }, [visible]);

  const fetchRoutes = async () => {
    try {
      console.log('Fetching routes...');
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('is_active', true)
        .order('origin');

      if (error) {
        console.error('Error fetching routes:', error);
        throw error;
      }
      
      console.log('Routes fetched:', data);
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Error', 'Failed to load routes');
    }
  };

  const fetchBuses = async (routeId: string) => {
  setLoading(true);
  try {
    console.log('Fetching buses for route:', routeId);
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Convert to PostgreSQL day format (1 = Monday, 7 = Sunday)
    const pgDayOfWeek = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
    
    console.log('Current day of week (PostgreSQL format):', pgDayOfWeek);
    
    const { data, error } = await supabase
      .from('buses')
      .select(`
        id,
        route_id,
        bus_number,
        capacity,
        departure_time,
        arrival_time,
        days_of_week,
        status,
        is_active,
        routes (
          id,
          name,
          origin,
          destination,
          price
        )
      `)
      .eq('route_id', routeId)
      .eq('is_active', true)
      .order('departure_time');

    if (error) {
      console.error('Error fetching buses:', error);
      throw error;
    }
    
    console.log('All buses for route:', data);
    
    // Filter buses that run today and generate schedule for next 7 days
    const schedules = [];
    const currentTime = today.toTimeString().slice(0, 5); // HH:MM format
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);
      const targetDayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay();
      
      (data || []).forEach(bus => {
        // Check if bus runs on this day
        if (bus.days_of_week && bus.days_of_week.includes(targetDayOfWeek)) {
          // If it's today, only show future times
          if (dayOffset === 0 && bus.departure_time <= currentTime) {
            return; // Skip past departure times for today
          }
          
          schedules.push({
            ...bus,
            // Create unique ID for each schedule entry
            scheduleId: `${bus.id}_${targetDate.toISOString().split('T')[0]}`,
            date: targetDate.toISOString().split('T')[0], // Add date field
            available_seats: bus.capacity, // You'll need to calculate actual availability
          });
        }
      });
    }
    
    console.log('Generated schedules:', schedules);
    setBuses(schedules);
    
  } catch (error) {
    console.error('Error fetching buses:', error);
    Alert.alert('Error', 'Failed to load schedules');
  } finally {
    setLoading(false);
  }
};

  const handleRouteSelect = (route: Route) => {
    console.log('Route selected:', route);
    setSelectedRoute(route);
    fetchBuses(route.id);
    setStep('schedule');
  };

  const handleBusSelect = (bus: Bus) => {
    console.log('Bus selected:', bus);
    setSelectedBus(bus);
    setStep('seat');
  };

  const handleSeatSelect = (seatNumber: number) => {
    setSelectedSeat(seatNumber);
    setStep('payment');
  };

  const handleClose = () => {
    setStep('route');
    setSelectedRoute(null);
    setSelectedBus(null);
    setSelectedSeat(null);
    setBuses([]);
    setRoutes([]);
    onClose();
  };

  const handleBack = () => {
    switch (step) {
      case 'schedule':
        setStep('route');
        setSelectedRoute(null);
        setBuses([]);
        break;
      case 'seat':
        setStep('schedule');
        setSelectedBus(null);
        break;
      case 'payment':
        setStep('seat');
        setSelectedSeat(null);
        break;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting time:', timeString, error);
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString;
    }
  };

  const renderRouteSelection = () => (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>Select Route</Text>
      {routes.length === 0 ? (
        <Text style={styles.loadingText}>No routes available</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {routes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={styles.routeCard}
              onPress={() => handleRouteSelect(route)}
            >
              <View style={styles.routeHeader}>
                <MapPin size={20} color={Colors.accent} />
                <Text style={styles.routeText}>
                  {route.origin} → {route.destination}
                </Text>
              </View>
              <Text style={styles.routePrice}>₦{route.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

 const renderScheduleSelection = () => (
  <View style={styles.content}>
    <Text style={styles.stepTitle}>Select Schedule</Text>
    <Text style={styles.routeInfo}>
      {selectedRoute?.origin} → {selectedRoute?.destination}
    </Text>
    
    {loading ? (
      <Text style={styles.loadingText}>Loading schedules...</Text>
    ) : buses.length === 0 ? (
      <Text style={styles.loadingText}>No schedules available for this route</Text>
    ) : (
      <ScrollView showsVerticalScrollIndicator={false}>
        {buses.map((bus, index) => (
          <TouchableOpacity
            key={bus.scheduleId || `${bus.id}_${bus.date}_${index}`} // Use unique scheduleId with fallback
            style={[
              styles.scheduleCard,
              bus.available_seats === 0 && styles.scheduleCardDisabled
            ]}
            onPress={() => handleBusSelect(bus)}
            disabled={bus.available_seats === 0}
          >
            <View style={styles.scheduleHeader}>
              <View style={styles.scheduleTime}>
                <Calendar size={16} color={Colors.accent} />
                <Text style={styles.scheduleDate}>{formatDate(bus.date)}</Text>
              </View>
              <View style={styles.scheduleSeats}>
                <Users size={16} color={Colors.lightGray} />
                <Text style={styles.seatsText}>{bus.available_seats} seats</Text>
              </View>
            </View>
            <View style={styles.scheduleDetails}>
              <View style={styles.timeInfo}>
                <Clock size={16} color={Colors.lightGray} />
                <Text style={styles.timeText}>
                  {formatTime(bus.departure_time)} - {formatTime(bus.arrival_time)}
                </Text>
              </View>
              <Text style={styles.busNumber}>Bus: {bus.bus_number}</Text>
              {bus.available_seats === 0 && (
                <Text style={styles.fullText}>FULL</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )}
  </View>
);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={step === 'route' ? handleClose : handleBack}>
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.title}>Book Bus</Text>
            <View style={{ width: 24 }} />
          </View>

          {step === 'route' && renderRouteSelection()}
          {step === 'schedule' && renderScheduleSelection()}
          
          <SeatSelectionModal
            visible={step === 'seat'}
            bus={selectedBus}
            onSeatSelect={handleSeatSelect}
            onClose={handleBack}
          />

          <PaymentModal
            visible={step === 'payment'}
            booking={{
              route: selectedRoute,
              bus: selectedBus,
              seat: selectedSeat,
              amount: selectedRoute?.price || DEFAULT_PRICE,
            }}
            onSuccess={handleClose}
            onClose={handleBack}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
    paddingTop: 100,
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginBottom: 20,
  },
  routeInfo: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.accent,
    marginBottom: 20,
  },
  routeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    marginLeft: 8,
  },
  routePrice: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.accent,
  },
  scheduleCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  scheduleCardDisabled: {
    opacity: 0.5,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleDate: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    marginLeft: 6,
  },
  scheduleSeats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    marginLeft: 4,
  },
  scheduleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    marginLeft: 6,
  },
  busNumber: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
  },
  fullText: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: Colors.error,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    textAlign: 'center',
    marginTop: 40,
  },
});