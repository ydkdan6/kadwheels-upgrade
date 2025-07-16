// // import React, { useState, useEffect } from 'react';
// // import {
// //   View,
// //   Text,
// //   StyleSheet,
// //   Modal,
// //   TouchableOpacity,
// //   ScrollView,
// //   TextInput,
// //   Alert,
// // } from 'react-native';
// // import { Colors } from '@/constants/Colors';
// // import { useAuth } from '@/hooks/useAuth';
// // import { supabase } from '@/lib/supabase';
// // import { X, Send, Bus, Users } from 'lucide-react-native';

// // interface AdminNotificationModalProps {
// //   visible: boolean;
// //   onClose: () => void;
// // }

// // interface Bus {
// //   id: string;
// //   departure_time: string;
// //   date: string;
// //   routes: {
// //     origin: string;
// //     destination: string;
// //   };
// // }

// // export default function AdminNotificationModal({ visible, onClose }: AdminNotificationModalProps) {
// //   const { user } = useAuth();
// //   const [buses, setBuses] = useState<Bus[]>([]);
// //   const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
// //   const [message, setMessage] = useState('');
// //   const [loading, setLoading] = useState(false);
// //   const [sending, setSending] = useState(false);

// //   useEffect(() => {
// //     if (visible) {
// //       fetchBuses();
// //     }
// //   }, [visible]);

// //   const fetchBuses = async () => {
// //     setLoading(true);
// //     try {
// //       const today = new Date().toISOString().split('T')[0];
// //       const { data, error } = await supabase
// //         .from('buses')
// //         .select(`
// //           *,
// //           routes (
// //             origin,
// //             destination
// //           )
// //         `)
// //         .gte('date', today)
// //         .eq('status', 'scheduled')
// //         .order('date')
// //         .order('departure_time');

// //       if (error) throw error;
// //       setBuses(data || []);
// //     } catch (error) {
// //       console.error('Error fetching buses:', error);
// //       Alert.alert('Error', 'Failed to load buses');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const getTemplateMessage = (bus: Bus) => {
// //     return `Bus for ${bus.routes.origin} → ${bus.routes.destination} has arrived at the bus stop!`;
// //   };

// //   const handleBusSelect = (bus: Bus) => {
// //     setSelectedBus(bus);
// //     setMessage(getTemplateMessage(bus));
// //   };

// //   const handleSendNotification = async () => {
// //     if (!selectedBus || !message.trim()) {
// //       Alert.alert('Error', 'Please select a bus and enter a message');
// //       return;
// //     }

// //     setSending(true);
// //     try {
// //       // Get users with active bookings for this bus
// //       const { data: bookings, error: bookingsError } = await supabase
// //         .from('bookings')
// //         .select('user_id, profiles(notification_token)')
// //         .eq('bus_id', selectedBus.id)
// //         .eq('booking_status', 'active');

// //       if (bookingsError) throw bookingsError;

// //       if (!bookings || bookings.length === 0) {
// //         Alert.alert('Info', 'No active bookings found for this bus');
// //         return;
// //       }

// //       // Create notification records
// //       const notifications = bookings.map(booking => ({
// //         title: 'Bus Arrival Notification',
// //         message: message.trim(),
// //         type: 'admin_announcement' as const,
// //         user_id: booking.user_id,
// //         bus_id: selectedBus.id,
// //         sent_by: user?.id,
// //       }));

// //       const { error: notificationError } = await supabase
// //         .from('notifications')
// //         .insert(notifications);

// //       if (notificationError) throw notificationError;

// //       // In a real app, you would send push notifications here
// //       // using the notification tokens from the bookings data

// //       Alert.alert(
// //         'Success', 
// //         `Notification sent to ${bookings.length} passenger${bookings.length > 1 ? 's' : ''}`
// //       );
      
// //       setSelectedBus(null);
// //       setMessage('');
// //       onClose();
// //     } catch (error: any) {
// //       console.error('Error sending notification:', error);
// //       Alert.alert('Error', error.message || 'Failed to send notification');
// //     } finally {
// //       setSending(false);
// //     }
// //   };

// //   const formatTime = (timeString: string) => {
// //     return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
// //       hour: '2-digit',
// //       minute: '2-digit',
// //     });
// //   };

// //   const formatDate = (dateString: string) => {
// //     return new Date(dateString).toLocaleDateString('en-US', {
// //       month: 'short',
// //       day: 'numeric',
// //     });
// //   };

// //   return (
// //     <Modal visible={visible} animationType="slide" transparent>
// //       <View style={styles.overlay}>
// //         <View style={styles.container}>
// //           <View style={styles.header}>
// //             <Text style={styles.title}>Send Notification</Text>
// //             <TouchableOpacity onPress={onClose} style={styles.closeButton}>
// //               <X size={24} color={Colors.white} />
// //             </TouchableOpacity>
// //           </View>

// //           <ScrollView style={styles.content}>
// //             <View style={styles.section}>
// //               <Text style={styles.sectionTitle}>Select Bus</Text>
// //               {loading ? (
// //                 <Text style={styles.loadingText}>Loading buses...</Text>
// //               ) : buses.length === 0 ? (
// //                 <Text style={styles.emptyText}>No scheduled buses found</Text>
// //               ) : (
// //                 buses.map((bus) => (
// //                   <TouchableOpacity
// //                     key={bus.id}
// //                     style={[
// //                       styles.busCard,
// //                       selectedBus?.id === bus.id && styles.selectedBusCard,
// //                     ]}
// //                     onPress={() => handleBusSelect(bus)}
// //                   >
// //                     <View style={styles.busHeader}>
// //                       <Bus size={20} color={Colors.accent} />
// //                       <Text style={styles.busRoute}>
// //                         {bus.routes.origin} → {bus.routes.destination}
// //                       </Text>
// //                     </View>
// //                     <Text style={styles.busTime}>
// //                       {formatDate(bus.date)} • {formatTime(bus.departure_time)}
// //                     </Text>
// //                   </TouchableOpacity>
// //                 ))
// //               )}
// //             </View>

// //             <View style={styles.section}>
// //               <Text style={styles.sectionTitle}>Message</Text>
// //               <TextInput
// //                 style={styles.messageInput}
// //                 value={message}
// //                 onChangeText={setMessage}
// //                 placeholder="Enter your message..."
// //                 placeholderTextColor={Colors.lightGray}
// //                 multiline
// //                 numberOfLines={4}
// //                 textAlignVertical="top"
// //               />
              
// //               {selectedBus && (
// //                 <TouchableOpacity
// //                   style={styles.templateButton}
// //                   onPress={() => setMessage(getTemplateMessage(selectedBus))}
// //                 >
// //                   <Text style={styles.templateButtonText}>Use Template Message</Text>
// //                 </TouchableOpacity>
// //               )}
// //             </View>

// //             {selectedBus && (
// //               <View style={styles.previewSection}>
// //                 <Text style={styles.previewTitle}>Preview</Text>
// //                 <View style={styles.previewCard}>
// //                   <Text style={styles.previewHeader}>Bus Arrival Notification</Text>
// //                   <Text style={styles.previewMessage}>{message}</Text>
// //                   <Text style={styles.previewTime}>Now</Text>
// //                 </View>
// //               </View>
// //             )}
// //           </ScrollView>

// //           <View style={styles.footer}>
// //             <View style={styles.infoCard}>
// //               <Users size={16} color={Colors.accent} />
// //               <Text style={styles.infoText}>
// //                 Notification will be sent to all passengers with active bookings for the selected bus
// //               </Text>
// //             </View>
            
// //             <TouchableOpacity
// //               style={[
// //                 styles.sendButton,
// //                 (!selectedBus || !message.trim() || sending) && styles.disabledButton,
// //               ]}
// //               onPress={handleSendNotification}
// //               disabled={!selectedBus || !message.trim() || sending}
// //             >
// //               <Send size={20} color={Colors.white} />
// //               <Text style={styles.sendButtonText}>
// //                 {sending ? 'Sending...' : 'Send Notification'}
// //               </Text>
// //             </TouchableOpacity>
// //           </View>
// //         </View>
// //       </View>
// //     </Modal>
// //   );
// // }

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     justifyContent: 'flex-end',
//   },
//   container: {
//     backgroundColor: Colors.background,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     maxHeight: '90%',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.borderColor,
//   },
//   title: {
//     fontSize: 18,
//     fontFamily: 'Poppins-Bold',
//     color: Colors.white,
//   },
//   closeButton: {
//     padding: 5,
//   },
//   content: {
//     flex: 1,
//     padding: 20,
//   },
//   section: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontFamily: 'Poppins-Bold',
//     color: Colors.white,
//     marginBottom: 12,
//   },
//   loadingText: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.lightGray,
//     textAlign: 'center',
//     padding: 20,
//   },
//   emptyText: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.lightGray,
//     textAlign: 'center',
//     padding: 20,
//   },
//   busCard: {
//     backgroundColor: Colors.cardBackground,
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 8,
//     borderWidth: 1,
//     borderColor: Colors.borderColor,
//   },
//   selectedBusCard: {
//     borderColor: Colors.accent,
//     backgroundColor: Colors.accent + '20',
//   },
//   busHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   busRoute: {
//     fontSize: 16,
//     fontFamily: 'Poppins-Medium',
//     color: Colors.white,
//     marginLeft: 8,
//   },
//   busTime: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.lightGray,
//   },
//   messageInput: {
//     backgroundColor: Colors.cardBackground,
//     borderRadius: 12,
//     padding: 16,
//     fontSize: 16,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.white,
//     borderWidth: 1,
//     borderColor: Colors.borderColor,
//     minHeight: 100,
//   },
//   templateButton: {
//     backgroundColor: Colors.accent + '20',
//     borderRadius: 8,
//     padding: 12,
//     marginTop: 8,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: Colors.accent,
//   },
//   templateButtonText: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Medium',
//     color: Colors.accent,
//   },
//   previewSection: {
//     marginBottom: 20,
//   },
//   previewTitle: {
//     fontSize: 16,
//     fontFamily: 'Poppins-Bold',
//     color: Colors.white,
//     marginBottom: 12,
//   },
//   previewCard: {
//     backgroundColor: Colors.cardBackground,
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: Colors.borderColor,
//   },
//   previewHeader: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Bold',
//     color: Colors.white,
//     marginBottom: 8,
//   },
//   previewMessage: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.lightGray,
//     marginBottom: 8,
//   },
//   previewTime: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.lightGray,
//   },
//   footer: {
//     padding: 20,
//     borderTopWidth: 1,
//     borderTopColor: Colors.borderColor,
//   },
//   infoCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: Colors.cardBackground,
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: Colors.borderColor,
//   },
//   infoText: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.lightGray,
//     marginLeft: 8,
//     flex: 1,
//   },
//   sendButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: Colors.accent,
//     paddingVertical: 16,
//     borderRadius: 12,
//   },
//   disabledButton: {
//     backgroundColor: Colors.darkGray,
//   },
//   sendButtonText: {
//     fontSize: 16,
//     fontFamily: 'Poppins-Medium',
//     color: Colors.white,
//     marginLeft: 8,
//   },
// });