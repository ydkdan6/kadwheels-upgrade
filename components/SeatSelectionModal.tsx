import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

interface SeatSelectionModalProps {
  visible: boolean;
  bus: any;
  onSeatSelect: (seatNumber: number) => void;
  onClose: () => void;
}

export default function SeatSelectionModal({
  visible,
  bus,
  onSeatSelect,
  onClose,
}: SeatSelectionModalProps) {
  const [takenSeats, setTakenSeats] = useState<number[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && bus) {
      fetchTakenSeats();
    }
  }, [visible, bus]);

  const fetchTakenSeats = async () => {
    if (!bus) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('seat_number')
        .eq('bus_id', bus.id)
        .in('booking_status', ['active', 'used'])
        .gte('expires_at', new Date().toISOString());

      if (error) throw error;
      setTakenSeats(data.map((booking: any) => booking.seat_number));
    } catch (error) {
      console.error('Error fetching taken seats:', error);
      Alert.alert('Error', 'Failed to load seat availability');
    }
  };

  const handleSeatPress = (seatNumber: number) => {
    if (takenSeats.includes(seatNumber)) return;
    setSelectedSeat(seatNumber);
  };

  const handleConfirm = () => {
    if (selectedSeat) {
      onSeatSelect(selectedSeat);
    }
  };

  const renderSeat = (seatNumber: number) => {
    const isTaken = takenSeats.includes(seatNumber);
    const isSelected = selectedSeat === seatNumber;

    return (
      <TouchableOpacity
        key={seatNumber}
        style={[
          styles.seat,
          isTaken && styles.takenSeat,
          isSelected && styles.selectedSeat,
        ]}
        onPress={() => handleSeatPress(seatNumber)}
        disabled={isTaken}
      >
        <Text
          style={[
            styles.seatText,
            isTaken && styles.takenSeatText,
            isSelected && styles.selectedSeatText,
          ]}
        >
          {seatNumber}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSeatMap = () => {
    const seats = [];
    const seatsPerRow = 4;
    const totalSeats = 50;

    for (let i = 1; i <= totalSeats; i += seatsPerRow) {
      const row = [];
      for (let j = 0; j < seatsPerRow && (i + j) <= totalSeats; j++) {
        const seatNumber = i + j;
        row.push(renderSeat(seatNumber));
        
        // Add aisle space after second seat
        if (j === 1) {
          row.push(<View key={`aisle-${i}-${j}`} style={styles.aisle} />);
        }
      }
      
      seats.push(
        <View key={`row-${i}`} style={styles.seatRow}>
          {row}
        </View>
      );
    }

    return seats;
  };

  if (!visible) return null;

  return (
    <View style={styles.content}>
      <Text style={styles.stepTitle}>Select Your Seat</Text>
      <Text style={styles.busInfo}>
        {bus?.routes?.origin} → {bus?.routes?.destination}
      </Text>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.availableSeat]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.selectedSeat]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.takenSeat]} />
          <Text style={styles.legendText}>Taken</Text>
        </View>
      </View>

      <ScrollView style={styles.seatMapContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.busHeader}>
          <Text style={styles.driverText}>Driver</Text>
        </View>
        <View style={styles.seatMap}>
          {renderSeatMap()}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {selectedSeat && (
          <Text style={styles.selectedSeatInfo}>
            Selected: Seat {selectedSeat} • ₦500
          </Text>
        )}
        <TouchableOpacity
          style={[styles.confirmButton, !selectedSeat && styles.disabledButton]}
          onPress={handleConfirm}
          disabled={!selectedSeat}
        >
          <Text style={styles.confirmButtonText}>
            {selectedSeat ? 'Proceed to Payment' : 'Select a Seat'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginBottom: 8,
  },
  busInfo: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.accent,
    marginBottom: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendSeat: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
  },
  seatMapContainer: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  busHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  driverText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.lightGray,
  },
  seatMap: {
    alignItems: 'center',
  },
  seatRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  seat: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  availableSeat: {
    backgroundColor: Colors.background,
    borderColor: Colors.accent,
  },
  selectedSeat: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  takenSeat: {
    backgroundColor: Colors.darkGray,
    borderColor: Colors.darkGray,
  },
  seatText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.accent,
  },
  selectedSeatText: {
    color: Colors.white,
  },
  takenSeatText: {
    color: Colors.lightGray,
  },
  aisle: {
    width: 20,
  },
  footer: {
    paddingTop: 20,
  },
  selectedSeatInfo: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: Colors.darkGray,
  },
  confirmButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
});