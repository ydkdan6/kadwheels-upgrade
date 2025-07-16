// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Colors } from '@/constants/Colors';
// import { Shield, Scan, DollarSign, Bell, Lock } from 'lucide-react-native';
// import AuthModal from '@/components/AuthModal';
// import QRScannerModal from '@/components/QRScannerModal';
// import PriceManagementModal from '@/components/PriceManagementModal';
// import AdminNotificationModal from '@/components/AdminNotificationModal';
// import { useAdminAuth } from '@/hooks/useAdminAuth';

// export default function AdminScreen() {
//   const { adminUser, signIn, signOut } = useAdminAuth();
//   const [showAuth, setShowAuth] = useState(false);
//   const [showQRScanner, setShowQRScanner] = useState(false);
//   const [showPriceManagement, setShowPriceManagement] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);

//   if (!adminUser) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.header}>
//           <Text style={styles.title}>Admin Panel</Text>
//         </View>

//         <View style={styles.signInPrompt}>
//           <Shield size={64} color={Colors.darkGray} />
//           <Text style={styles.signInTitle}>Admin Access Required</Text>
//           <Text style={styles.signInText}>
//             Please sign in with your admin credentials to access the admin panel
//           </Text>
//           <TouchableOpacity
//             style={styles.signInButton}
//             onPress={() => setShowAuth(true)}
//           >
//             <Text style={styles.signInButtonText}>Admin Sign In</Text>
//           </TouchableOpacity>
//         </View>

//         <AuthModal
//           visible={showAuth}
//           onClose={() => setShowAuth(false)}
//           isAdminAuth={true}
//         />
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <View style={styles.headerContent}>
//           <View>
//             <Text style={styles.title}>Admin Panel</Text>
//             <Text style={styles.subtitle}>Welcome, Admin</Text>
//           </View>
//           <TouchableOpacity
//             style={styles.signOutButton}
//             onPress={signOut}
//           >
//             <Text style={styles.signOutButtonText}>Sign Out</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <ScrollView style={styles.scrollView}>
//         <View style={styles.adminSection}>
//           <TouchableOpacity
//             style={styles.adminCard}
//             onPress={() => setShowQRScanner(true)}
//           >
//             <View style={styles.cardIcon}>
//               <Scan size={32} color={Colors.accent} />
//             </View>
//             <View style={styles.cardContent}>
//               <Text style={styles.cardTitle}>QR Code Scanner</Text>
//               <Text style={styles.cardDescription}>
//                 Scan and verify student tickets
//               </Text>
//             </View>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.adminCard}
//             onPress={() => setShowPriceManagement(true)}
//           >
//             <View style={styles.cardIcon}>
//               <DollarSign size={32} color={Colors.accent} />
//             </View>
//             <View style={styles.cardContent}>
//               <Text style={styles.cardTitle}>Route Price Management</Text>
//               <Text style={styles.cardDescription}>
//                 View and update route prices
//               </Text>
//             </View>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.adminCard}
//             onPress={() => setShowNotifications(true)}
//           >
//             <View style={styles.cardIcon}>
//               <Bell size={32} color={Colors.accent} />
//             </View>
//             <View style={styles.cardContent}>
//               <Text style={styles.cardTitle}>Send Notifications</Text>
//               <Text style={styles.cardDescription}>
//                 Send announcements to students
//               </Text>
//             </View>
//           </TouchableOpacity>
//         </View>

//         <View style={styles.statsSection}>
//           <Text style={styles.statsTitle}>Quick Stats</Text>
//           <View style={styles.statsGrid}>
//             <View style={styles.statCard}>
//               <Text style={styles.statNumber}>0</Text>
//               <Text style={styles.statLabel}>Active Bookings</Text>
//             </View>
//             <View style={styles.statCard}>
//               <Text style={styles.statNumber}>0</Text>
//               <Text style={styles.statLabel}>Today's Revenue</Text>
//             </View>
//             <View style={styles.statCard}>
//               <Text style={styles.statNumber}>0</Text>
//               <Text style={styles.statLabel}>Buses Running</Text>
//             </View>
//             <View style={styles.statCard}>
//               <Text style={styles.statNumber}>0</Text>
//               <Text style={styles.statLabel}>Total Users</Text>
//             </View>
//           </View>
//         </View>
//       </ScrollView>

//       <QRScannerModal
//         visible={showQRScanner}
//         onClose={() => setShowQRScanner(false)}
//       />

//       <PriceManagementModal
//         visible={showPriceManagement}
//         onClose={() => setShowPriceManagement(false)}
//       />

//       <AdminNotificationModal
//         visible={showNotifications}
//         onClose={() => setShowNotifications(false)}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.background,
//   },
//   header: {
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.borderColor,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 24,
//     fontFamily: 'Poppins-Bold',
//     color: Colors.white,
//   },
//   subtitle: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.lightGray,
//     marginTop: 4,
//   },
//   signOutButton: {
//     backgroundColor: Colors.error,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 6,
//   },
//   signOutButtonText: {
//     color: Colors.white,
//     fontSize: 14,
//     fontFamily: 'Poppins-Medium',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   signInPrompt: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 40,
//   },
//   signInTitle: {
//     fontSize: 20,
//     fontFamily: 'Poppins-Bold',
//     color: Colors.white,
//     marginTop: 20,
//     marginBottom: 8,
//   },
//   signInText: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.lightGray,
//     textAlign: 'center',
//     marginBottom: 30,
//   },
//   signInButton: {
//     backgroundColor: Colors.accent,
//     paddingHorizontal: 32,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   signInButtonText: {
//     color: Colors.white,
//     fontSize: 16,
//     fontFamily: 'Poppins-Medium',
//   },
//   accessDenied: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 40,
//   },
//   accessDeniedTitle: {
//     fontSize: 20,
//     fontFamily: 'Poppins-Bold',
//     color: Colors.error,
//     marginTop: 20,
//     marginBottom: 8,
//   },
//   accessDeniedText: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.lightGray,
//     textAlign: 'center',
//   },
//   adminSection: {
//     padding: 20,
//   },
//   adminCard: {
//     flexDirection: 'row',
//     backgroundColor: Colors.cardBackground,
//     borderRadius: 12,
//     padding: 20,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: Colors.borderColor,
//     alignItems: 'center',
//   },
//   cardIcon: {
//     marginRight: 16,
//   },
//   cardContent: {
//     flex: 1,
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontFamily: 'Poppins-Bold',
//     color: Colors.white,
//     marginBottom: 4,
//   },
//   cardDescription: {
//     fontSize: 14,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.lightGray,
//   },
//   statsSection: {
//     padding: 20,
//     paddingTop: 0,
//   },
//   statsTitle: {
//     fontSize: 18,
//     fontFamily: 'Poppins-Bold',
//     color: Colors.white,
//     marginBottom: 16,
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   statCard: {
//     backgroundColor: Colors.cardBackground,
//     borderRadius: 12,
//     padding: 16,
//     width: '48%',
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: Colors.borderColor,
//     alignItems: 'center',
//   },
//   statNumber: {
//     fontSize: 24,
//     fontFamily: 'Poppins-Bold',
//     color: Colors.accent,
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     fontFamily: 'Poppins-Regular',
//     color: Colors.lightGray,
//     textAlign: 'center',
//   },
// });