import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { CreditCard, CheckCircle, X } from 'lucide-react-native';
import TicketModal from './TicketModal';

// Try to import WebView, fallback to mock payment if not available
let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch (e) {
  console.log('WebView not available, using mock payment');
}

interface PaymentModalProps {
  visible: boolean;
  booking: {
    route?: {
      id: string;
      origin: string;
      destination: string;
      name?: string;
    };
    bus?: {
      id: string;
      date: string;
      departure_time: string;
      arrival_time: string;
      route_id?: string;
      routes?: {
        id: string;
        origin: string;
        destination: string;
        name?: string;
      };
    };
    seat: number | null;
    amount: number;
  };
  onSuccess: () => void;
  onClose: () => void;
}

const PaymentModal = ({
  visible,
  booking,
  onSuccess,
  onClose,
}: PaymentModalProps) => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [showPaystack, setShowPaystack] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Your Paystack public key - replace with your actual public key
  const PAYSTACK_PUBLIC_KEY = 'pk_test_593b7dee58760f90640a3ae15a6b7fbcdee662ee';

  const generateQRData = () => {
    return JSON.stringify({
      userId: user?.id,
      userName: user?.user_metadata?.full_name || user?.email,
      route: `${booking.route?.origin || 'Unknown'} → ${booking.route?.destination || 'Unknown'}`,
      seat: booking.seat,
      amount: booking.amount,
      date: booking.bus?.date,
      time: booking.bus?.departure_time,
      purchaseTime: new Date().toISOString(),
    });
  };

  const generatePaymentReference = () => {
    return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const generatePaystackHTML = () => {
    const reference = generatePaymentReference();
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Paystack Payment</title>
        <script src="https://js.paystack.co/v1/inline.js"></script>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background-color: #f5f5f5;
            margin: 0;
          }
          .container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
          }
          .pay-button {
            background-color: #00C896;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            margin-top: 20px;
          }
          .pay-button:hover {
            background-color: #00B085;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin: 20px 0;
          }
          .info {
            color: #666;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Complete Payment</h2>
          <div class="amount">₦${booking.amount}</div>
          <div class="info">Route: ${booking.route?.origin || 'Unknown'} → ${booking.route?.destination || 'Unknown'}</div>
          <div class="info">Seat: #${booking.seat}</div>
          <button class="pay-button" onclick="payWithPaystack()">
            Pay ₦${booking.amount}
          </button>
        </div>

        <script>
          function payWithPaystack() {
            const handler = PaystackPop.setup({
              key: '${PAYSTACK_PUBLIC_KEY}',
              email: '${user?.email || ''}',
              amount: ${booking.amount * 100}, // Amount in kobo
              currency: 'NGN',
              ref: '${reference}',
              metadata: {
                custom_fields: [
                  {
                    display_name: "Route",
                    variable_name: "route",
                    value: "${booking.route?.origin || 'Unknown'} → ${booking.route?.destination || 'Unknown'}"
                  },
                  {
                    display_name: "Seat Number",
                    variable_name: "seat",
                    value: "${booking.seat}"
                  }
                ]
              },
              callback: function(response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'payment_success',
                  reference: response.reference,
                  status: response.status
                }));
              },
              onClose: function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'payment_cancelled'
                }));
              }
            });
            handler.openIframe();
          }
          
          // Auto-trigger payment on load
          document.addEventListener('DOMContentLoaded', function() {
            setTimeout(payWithPaystack, 1000);
          });
        </script>
      </body>
      </html>
    `;
  };

  const handlePaymentInitiation = async () => {
    if (!user || !booking.seat) {
      Alert.alert('Error', 'Please ensure you are logged in and have selected a seat');
      return;
    }

    setProcessing(true);
    try {
      // Check if seat is still available before processing payment
      const { data: existingBooking, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('bus_id', booking.bus?.id)
        .eq('travel_date', booking.bus?.date)
        .eq('seat_number', booking.seat)
        .eq('booking_status', 'active')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is what we want
        throw checkError;
      }

      if (existingBooking) {
        throw new Error(`Seat #${booking.seat} is no longer available. Please select a different seat.`);
      }

      // If WebView is available, use Paystack, otherwise use mock payment
      if (WebView) {
        setShowPaystack(true);
      } else {
        // Mock payment for development/testing
        await handleMockPayment();
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      Alert.alert('Payment Failed', error.message || 'Something went wrong');
    } finally {
      setProcessing(false);
    }
  };

  const handleMockPayment = async () => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockResponse = {
      reference: generatePaymentReference(),
      status: 'success'
    };
    
    await handlePaymentSuccess(mockResponse);
  };

  const handlePaymentSuccess = async (response: any) => {
    setShowPaystack(false);
    setProcessing(true);

    try {
      // Create booking record after successful payment
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const qrData = generateQRData();

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          bus_id: booking.bus?.id,
          seat_number: booking.seat,
          amount_paid: booking.amount,
          payment_reference: response.reference,
          payment_status: 'completed',
          booking_status: 'active',
          qr_code_data: qrData,
          expires_at: expiresAt.toISOString(),
          travel_date: booking.bus?.date,
        })
        .select(`
          *,
          buses (
            id,
            date,
            departure_time,
            arrival_time,
            routes (
              id,
              origin,
              destination,
              name
            )
          )
        `)
        .single();

      if (bookingError) {
        // Handle seat already booked error
        if (bookingError.code === '23505' && bookingError.message.includes('bookings_bus_id_travel_date_seat_number_key')) {
          throw new Error(`Seat #${booking.seat} is no longer available. Please select a different seat.`);
        }
        throw bookingError;
      }

      // Create notifications
      await supabase.from('notifications').insert([
        {
          title: 'Booking Confirmed',
          message: `Your seat on ${booking.route?.origin || 'Unknown'} → ${booking.route?.destination || 'Unknown'} is confirmed for ₦${booking.amount}!`,
          type: 'booking_confirmation',
          user_id: user.id,
          bus_id: booking.bus?.id,
        },
        {
          title: 'Ticket Generated',
          message: 'Your QR ticket is ready!',
          type: 'ticket_generated',
          user_id: user.id,
          bus_id: booking.bus?.id,
        },
      ]);

      // Enhanced ticket data structure to prevent undefined routes error
      const enhancedTicketData = {
        ...bookingData,
        // Ensure route data is available
        route: booking.route || bookingData.buses?.routes || {
          origin: 'Unknown',
          destination: 'Unknown',
          name: 'Unknown Route'
        },
        // Ensure bus data is available
        bus: booking.bus || bookingData.buses || {
          id: bookingData.bus_id,
          date: bookingData.travel_date,
          departure_time: 'Unknown',
          arrival_time: 'Unknown'
        },
        // Fallback for buses property that TicketModal expects
        buses: bookingData.buses || {
          id: bookingData.bus_id,
          date: bookingData.travel_date,
          departure_time: booking.bus?.departure_time || 'Unknown',
          arrival_time: booking.bus?.arrival_time || 'Unknown',
          routes: booking.route || bookingData.buses?.routes || {
            origin: 'Unknown',
            destination: 'Unknown',
            name: 'Unknown Route'
          }
        }
      };

      setTicketData(enhancedTicketData);
      setShowTicket(true);
    } catch (error: any) {
      console.error('Booking creation error:', error);
      Alert.alert('Booking Failed', error.message || 'Payment was successful but booking failed. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaystack(false);
    Alert.alert('Payment Cancelled', 'Your payment was cancelled');
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'payment_success') {
        handlePaymentSuccess(data);
      } else if (data.type === 'payment_cancelled') {
        handlePaymentCancel();
      }
    } catch (error) {
      console.error('WebView message error:', error);
    }
  };

  const handleTicketClose = () => {
    setShowTicket(false);
    onSuccess();
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.content}>
            <View style={styles.bookingSummary}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Route:</Text>
                <Text style={styles.summaryValue}>
                  {booking.route?.origin || 'Unknown'} → {booking.route?.destination || 'Unknown'}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>
                  {formatDate(booking.bus?.date || '')}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>
                  {formatTime(booking.bus?.departure_time || '')} - {formatTime(booking.bus?.arrival_time || '')}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Seat:</Text>
                <Text style={styles.summaryValue}>#{booking.seat}</Text>
              </View>
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>₦{booking.amount}</Text>
              </View>
            </View>

            <View style={styles.paymentSection}>
              <Text style={styles.paymentTitle}>Payment Method</Text>
              <View style={styles.paymentMethod}>
                <CreditCard size={24} color={Colors.accent} />
                <Text style={styles.paymentMethodText}>
                  {WebView ? 'Paystack (Card, Bank Transfer, USSD)' : 'Mock Payment (Development)'}
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.payButton, processing && styles.disabledButton]}
                onPress={handlePaymentInitiation}
                disabled={processing}
              >
                {processing ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color={Colors.white} />
                    <Text style={[styles.payButtonText, { marginLeft: 8 }]}>
                      Processing...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.payButtonText}>
                    Pay ₦{booking.amount}
                  </Text>
                )}
              </TouchableOpacity>
              
              <Text style={styles.disclaimer}>
                {WebView ? 'Secure payment powered by Paystack' : 'Development mode - Mock payment'}
              </Text>
            </View>
          </View>

          {/* Paystack Payment WebView */}
          {showPaystack && WebView && (
            <Modal visible={showPaystack} animationType="slide">
              <View style={styles.webViewContainer}>
                <View style={styles.webViewHeader}>
                  <Text style={styles.webViewTitle}>Secure Payment</Text>
                  <TouchableOpacity onPress={handlePaymentCancel}>
                    <X size={24} color={Colors.white} />
                  </TouchableOpacity>
                </View>
                <WebView
                  ref={webViewRef}
                  source={{ html: generatePaystackHTML() }}
                  style={styles.webView}
                  onMessage={handleWebViewMessage}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  scalesPageToFit={true}
                />
              </View>
            </Modal>
          )}

          <TicketModal
            visible={showTicket}
            ticket={ticketData}
            onClose={handleTicketClose}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  content: {
    padding: 20,
    maxHeight: '80%',
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginBottom: 20,
  },
  bookingSummary: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.accent,
  },
  paymentSection: {
    marginBottom: 30,
  },
  paymentTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginBottom: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  paymentMethodText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    marginLeft: 12,
  },
  footer: {
    marginTop: 'auto',
  },
  payButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: Colors.darkGray,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    textAlign: 'center',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  webViewTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.white,
    fontWeight: 'bold',
  },
  webView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default PaymentModal;