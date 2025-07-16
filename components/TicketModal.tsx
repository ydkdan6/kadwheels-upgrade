import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import CameraRoll from '@react-native-community/cameraroll';
import { Colors } from '@/constants/Colors';
import { X, Download, Share, AlertTriangle } from 'lucide-react-native';

interface TicketModalProps {
  visible: boolean;
  ticket: any;
  onClose: () => void;
}

export default function TicketModal({ visible, ticket, onClose }: TicketModalProps) {
  const viewShotRef = React.useRef(null);

  if (!ticket) return null;

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    try {
      // Handle different time formats
      const time = timeString.includes('T') ? timeString : `2000-01-01T${timeString}`;
      return new Date(time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return dateString;
    }
  };

  const getRouteDisplay = () => {
    // Handle different route data structures - Fixed with proper null checking
    if (ticket.buses?.routes?.origin && ticket.buses?.routes?.destination) {
      return `${ticket.buses.routes.origin} → ${ticket.buses.routes.destination}`;
    } else if (ticket.route?.origin && ticket.route?.destination) {
      return `${ticket.route.origin} → ${ticket.route.destination}`;
    } else if (ticket.route?.origin && ticket.route?.to_campus) {
      return `${ticket.route.origin} → ${ticket.route.to_campus}`;
    } else if (ticket.route?.from && ticket.route?.to) {
      return `${ticket.route.from} → ${ticket.route.to}`;
    } else if (ticket.route?.name) {
      return ticket.route.name;
    }
    return 'Route information not available';
  };

  const getTravelDate = () => {
    // Try different date sources
    return ticket.travel_date || ticket.bus?.date || ticket.buses?.date || ticket.date;
  };

  const getDepartureTime = () => {
    // Try different time sources - Fixed with proper null checking
    return ticket.buses?.departure_time || ticket.bus?.departure_time || ticket.departure_time;
  };

  const getArrivalTime = () => {
    // Try different time sources - Added for consistency
    return ticket.buses?.arrival_time || ticket.bus?.arrival_time || ticket.arrival_time;
  };

  const getRouteOrigin = () => {
    return ticket.buses?.routes?.origin || ticket.route?.origin || ticket.route?.from || 'Unknown';
  };

  const getRouteDestination = () => {
    return ticket.buses?.routes?.destination || ticket.route?.destination || ticket.route?.to || ticket.route?.to_campus || 'Unknown';
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'This app needs access to your storage to save the ticket',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const saveToPhotos = async () => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Storage permission is required to save the ticket.');
        return;
      }

      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        await CameraRoll.save(uri, { type: 'photo' });
        Alert.alert('Success', 'Ticket saved to photos!');
      }
    } catch (error) {
      console.error('Error saving to photos:', error);
      Alert.alert('Error', 'Failed to save ticket to photos');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Your Ticket</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
              <View style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketTitle}>Kaduna Polytechnic</Text>
                  <Text style={styles.ticketSubtitle}>Bus Ticket</Text>
                </View>

                <View style={styles.qrContainer}>
                  <QRCode
                    value={ticket.qr_code_data || 'No QR data available'}
                    size={150}
                    backgroundColor="white"
                    color="black"
                  />
                </View>

                <View style={styles.ticketDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Route</Text>
                    <Text style={styles.detailValue}>
                      {getRouteOrigin()} → {getRouteDestination()}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(getTravelDate())}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Departure</Text>
                    <Text style={styles.detailValue}>
                      {formatTime(getDepartureTime())}
                    </Text>
                  </View>

                  {getArrivalTime() && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Arrival</Text>
                      <Text style={styles.detailValue}>
                        {formatTime(getArrivalTime())}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Seat Number</Text>
                    <Text style={styles.detailValue}>#{ticket.seat_number || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount Paid</Text>
                    <Text style={styles.detailValue}>₦{ticket.amount_paid || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Purchased</Text>
                    <Text style={styles.detailValue}>
                      {formatDateTime(ticket.created_at)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reference</Text>
                    <Text style={styles.detailValue}>{ticket.payment_reference || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.expiryWarning}>
                  <AlertTriangle size={20} color={Colors.warning} />
                  <Text style={styles.expiryText}>
                    This ticket expires 24 hours after purchase
                  </Text>
                </View>
              </View>
            </ViewShot>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={saveToPhotos}>
                <Download size={20} color={Colors.accent} />
                <Text style={styles.actionText}>Save to Photos</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Share size={20} color={Colors.accent} />
                <Text style={styles.actionText}>Share Ticket</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>Instructions</Text>
              <Text style={styles.instructionsText}>
                • Show this QR code to the bus conductor when boarding
              </Text>
              <Text style={styles.instructionsText}>
                • Arrive at the bus stop 10 minutes before departure
              </Text>
              <Text style={styles.instructionsText}>
                • Keep your ticket until you reach your destination
              </Text>
              <Text style={styles.instructionsText}>
                • Contact support if you have any issues
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: Colors.background,
    margin: 20,
    borderRadius: 20,
    maxHeight: '100%',
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
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  ticketCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  ticketHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ticketTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.background,
    textAlign: 'center',
  },
  ticketSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.darkGray,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 20,
  },
  ticketDetails: {
    width: '100%',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.darkGray,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.background,
    flex: 1,
    textAlign: 'right',
  },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  expiryText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#856404',
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.accent,
    marginLeft: 8,
  },
  instructions: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  instructionsTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    marginBottom: 8,
    lineHeight: 20,
  },
});