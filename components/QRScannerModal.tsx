// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Modal,
//   TouchableOpacity,
//   Alert,
// } from 'react-native';
// import { BarCodeScanner } from 'expo-barcode-scanner';
// import { Colors } from '@/constants/Colors';
// import { supabase } from '@/lib/supabase';
// import { X, CheckCircle, XCircle, Scan } from 'lucide-react-native';

// interface QRScannerModalProps {
//   visible: boolean;
//   onClose: () => void;
// }

// export default function QRScannerModal({ visible, onClose }: QRScannerModalProps) {
//   const [hasPermission, setHasPermission] = useState<boolean | null>(null);
//   const [scanned, setScanned] = useState(false);
//   const [ticketData, setTicketData] = useState<any>(null);
//   const [verificationResult, setVerificationResult] = useState<'valid' | 'invalid' | null>(null);

//   useEffect(() => {
//     const getBarCodeScannerPermissions = async () => {
//       const { status } = await BarCodeScanner.requestPermissionsAsync();
//       setHasPermission(status === 'granted');
//     };

//     if (visible) {
//       getBarCodeScannerPermissions();
//     }
//   }, [visible]);

//   const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
//     setScanned(true);
    
//     try {
//       // Parse QR code data
//       const qrData = JSON.parse(data);
//       setTicketData(qrData);
      
//       // Verify ticket in database
//       const { data: booking, error } = await supabase
//         .from('bookings')
//         .select(`
//           *,
//           buses (
//             *,
//             routes (*)
//           ),
//           profiles (full_name)
//         `)
//         .eq('user_id', qrData.userId)
//         .eq('qr_code_data', data)
//         .single();

//       if (error || !booking) {
//         setVerificationResult('invalid');
//         return;
//       }

//       // Check if ticket is still valid
//       const now = new Date();
//       const expiresAt = new Date(booking.expires_at);
      
//       if (booking.booking_status !== 'active' || expiresAt < now) {
//         setVerificationResult('invalid');
//         return;
//       }

//       setVerificationResult('valid');
      
//       // Mark ticket as used
//       await supabase
//         .from('bookings')
//         .update({ booking_status: 'used' })
//         .eq('id', booking.id);

//     } catch (error) {
//       console.error('Error verifying ticket:', error);
//       setVerificationResult('invalid');
//     }
//   };

//   const resetScanner = () => {
//     setScanned(false);
//     setTicketData(null);
//     setVerificationResult(null);
//   };

//   const handleClose = () => {
//     resetScanner();
//     onClose();
//   };

//   if (hasPermission === null) {
//     return (
//       <Modal visible={visible} animationType="slide" transparent>
//         <View style={styles.overlay}>
//           <View style={styles.container}>
//             <Text style={styles.permissionText}>Requesting camera permission...</Text>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   if (hasPermission === false) {
//     return (
//       <Modal visible={visible} animationType="slide" transparent>
//         <View style={styles.overlay}>
//           <View style={styles.container}>
//             <View style={styles.header}>
//               <Text style={styles.title}>QR Scanner</Text>
//               <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
//                 <X size={24} color={Colors.white} />
//               </TouchableOpacity>
//             </View>
//             <View style={styles.permissionDenied}>
//               <Text style={styles.permissionText}>Camera permission denied</Text>
//               <Text style={styles.permissionSubtext}>
//                 Please enable camera access in settings to scan QR codes
//               </Text>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   return (
//     <Modal visible={visible} animationType="slide" transparent>
//       <View style={styles.overlay}>
//         <View style={styles.container}>
//           <View style={styles.header}>
//             <Text style={styles.title}>QR Scanner</Text>
//             <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
//               <X size={24} color={Colors.white} />
//             </TouchableOpacity>
//           </View>

//           {!scanned ? (
//             <View style={styles.scannerContainer}>
//               <BarCodeScanner
//                 onBarCodeScanned={handleBarCodeScanned}
//                 style={styles.scanner}
//               />
//               <View style={styles.scannerOverlay}>
//                 <View style={styles.scannerFrame} />
//                 <Text style={styles.scannerText}>
//                   Point camera at QR code to scan ticket
//                 </Text>
//               </View>
//             </View>
//           ) : (
//             <View style={styles.resultContainer}>
//               {verificationResult === 'valid' ? (
//                 <View style={styles.validResult}>
//                   <CheckCircle size={64} color={Colors.success} />
//                   <Text style={styles.resultTitle}>Valid Ticket</Text>
                  
//                   {ticketData && (
//                     <View style={styles.ticketInfo}>
//                       <Text style={styles.ticketDetail}>
//                         Passenger: {ticketData.userName}
//                       </Text>
//                       <Text style={styles.ticketDetail}>
//                         Route: {ticketData.route}
//                       </Text>
//                       <Text style={styles.ticketDetail}>
//                         Seat: #{ticketData.seat}
//                       </Text>
//                       <Text style={styles.ticketDetail}>
//                         Amount: ₦{ticketData.amount}
//                       </Text>
//                       <Text style={styles.ticketDetail}>
//                         Date: {new Date(ticketData.date).toLocaleDateString()}
//                       </Text>
//                       <Text style={styles.ticketDetail}>
//                         Time: {ticketData.time}
//                       </Text>
//                     </View>
//                   )}
//                 </View>
//               ) : (
//                 <View style={styles.invalidResult}>
//                   <XCircle size={64} color={Colors.error} />
//                   <Text style={styles.resultTitle}>Invalid/Expired Ticket</Text>
//                   <Text style={styles.resultSubtext}>
//                     This ticket is either invalid, expired, or has already been used
//                   </Text>
//                 </View>
//               )}

//               <TouchableOpacity style={styles.scanAgainButton} onPress={resetScanner}>
//                 <Scan size={20} color={Colors.white} />
//                 <Text style={styles.scanAgainText}>Scan Another Ticket</Text>
//               </TouchableOpacity>
//             </View>
//           )}
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.9)',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: Colors.background,
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
//     fontSize: 20,
//     fontFamily: 'Poppins-Bold',
//     color: Colors.white,
//   },
//   closeButton: {
//     padding: 5,
//   },
//   scannerContainer: {
//     flex: 1,
//     position: 'relative',
//   },
//   scanner: {
//     flex: 1,
//   },
//   scannerOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   scannerFrame: {
//     width: 250,
//     height: 250,
//     borderWidth: 2,
//     borderColor: Colors.accent,
//     borderRadius: 12,
//     backgroundColor: 'transparent',
//   },
//   scannerText: {
//     fontSize: 16,
//     fontFamily: 'Poppins-Medium',
//     color: Colors.white,
//     textAlign: 'center',
//     marginTop: 20,
//     paddingHorizontal: 40,
//   },
//   resultContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   validResult: {
//     alignItems: 'center',
//     marginBottom: 40,
//   },
//   invalidResult: {
//     alignItems: 'center',
//     marginBottom: 40,
//   },
//   resultTitle: {
//     fontSize: 24,
//     fontFamily: 'Poppins-Bold',
//     color: Colors.white,
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   resultSubtext: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.lightGray,
//     textAlign: 'center',
//   },
//   ticketInfo: {
//     backgroundColor: Colors.cardBackground,
//     borderRadius: 12,
//     padding: 16,
//     marginTop: 20,
//     width: '100%',
//     borderWidth: 1,
//     borderColor: Colors.borderColor,
//   },
//   ticketDetail: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.white,
//     marginBottom: 8,
//   },
//   scanAgainButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: Colors.accent,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   scanAgainText: {
//     fontSize: 16,
//     fontFamily: 'Poppins-Medium',
//     color: Colors.white,
//     marginLeft: 8,
//   },
//   permissionDenied: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 40,
//   },
//   permissionText: {
//     fontSize: 18,
//     fontFamily: 'Poppins-Bold',
//     color: Colors.white,
//     textAlign: 'center',
//     marginBottom: 10,
//   },
//   permissionSubtext: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.lightGray,
//     textAlign: 'center',
//   },
// });