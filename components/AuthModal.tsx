import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { X, Eye, EyeOff } from 'lucide-react-native';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  isAdminAuth?: boolean;
}

export default function AuthModal({ visible, onClose, initialMode = 'login', isAdminAuth = false }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, signInAdmin } = useAuth();
  // const { signIn: adminSignIn } = useAdminAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (!isAdminAuth && mode === 'signup' && !fullName) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (isAdminAuth && !adminCode) {
      Alert.alert('Error', 'Please enter admin access code');
      return;
    }

    setLoading(true);
    try {
      if (isAdminAuth) {
        // Use the enhanced admin sign in with code validation
        const { error } = await signInAdmin(email, password, adminCode);
        if (error) throw error;
      } else {
        if (mode === 'login') {
          const { error } = await signIn(email, password);
          if (error) throw error;
        } else {
          const { error } = await signUp(email, password, fullName);
          if (error) throw error;
          Alert.alert('Success', 'Account created successfully! Please check your email for verification.');
        }
      }
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setAdminCode('');
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isAdminAuth ? 'Admin Login' : mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.lightGray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {!isAdminAuth && mode === 'signup' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.lightGray}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={Colors.lightGray}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.lightGray}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={Colors.lightGray} />
                  ) : (
                    <Eye size={20} color={Colors.lightGray} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {isAdminAuth && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Admin Access Code</Text>
                <TextInput
                  style={styles.input}
                  value={adminCode}
                  onChangeText={setAdminCode}
                  placeholder="Enter admin access code"
                  placeholderTextColor={Colors.lightGray}
                  autoCapitalize="characters"
                  secureTextEntry
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Please wait...' : isAdminAuth ? 'Admin Sign In' : mode === 'login' ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            {!isAdminAuth && (
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                </Text>
                <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                  <Text style={styles.switchLink}>
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isAdminAuth && (
              <View style={styles.adminInfo}>
                <Text style={styles.adminInfoText}>
                  Use admin credentials and access code to access the admin panel
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  closeButton: {
    padding: 5,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.white,
  },
  eyeButton: {
    padding: 16,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  switchText: {
    color: Colors.lightGray,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  switchLink: {
    color: Colors.accent,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  adminInfo: {
    marginTop: 20,
    padding: 12,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  adminInfoText: {
    color: Colors.lightGray,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
});