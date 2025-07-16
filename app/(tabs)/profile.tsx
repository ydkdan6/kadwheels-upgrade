import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { User, Edit, LogOut, MessageSquare, Settings } from 'lucide-react-native';
import AuthModal from '@/components/AuthModal';
import EditProfileModal from '@/components/EditProfileModal';
import FeedbackModal from '@/components/FeedbackModal';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [showAuth, setShowAuth] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.signInPrompt}>
          <User size={64} color={Colors.darkGray} />
          <Text style={styles.signInTitle}>Sign In to Your Account</Text>
          <Text style={styles.signInText}>
            Access your profile, view bookings, and manage your account
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => setShowAuth(true)}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <AuthModal
          visible={showAuth}
          onClose={() => setShowAuth(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <User size={48} color={Colors.accent} />
          </View>
          <Text style={styles.userName}>
            {profile?.full_name || 'Student'}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {profile?.phone && (
            <Text style={styles.userPhone}>{profile.phone}</Text>
          )}
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowEditProfile(true)}
          >
            <Edit size={20} color={Colors.accent} />
            <Text style={styles.menuText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowFeedback(true)}
          >
            <MessageSquare size={20} color={Colors.accent} />
            <Text style={styles.menuText}>Provide Feedback</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Settings size={20} color={Colors.accent} />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.signOutItem]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color={Colors.error} />
            <Text style={[styles.menuText, styles.signOutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>Kaduna Polytechnic Bus App</Text>
          <Text style={styles.appInfoText}>Version 1.0.0</Text>
          <Text style={styles.appInfoText}>
            Book buses, reserve seats, and travel with ease
          </Text>
        </View>
      </ScrollView>

      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />

      <FeedbackModal
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
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
  },
  signInPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  signInTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginTop: 20,
    marginBottom: 8,
  },
  signInText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 30,
  },
  signInButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  profileSection: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
  },
  menuSection: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  menuText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    marginLeft: 16,
  },
  signOutItem: {
    marginTop: 20,
  },
  signOutText: {
    color: Colors.error,
  },
  appInfo: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
  },
  appInfoTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    marginBottom: 8,
  },
  appInfoText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 4,
  },
});