import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { X, Edit, Save, DollarSign } from 'lucide-react-native';

interface PriceManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Route {
  id: string;
  origin: string;
  destination: string;
  price: number;
}

export default function PriceManagementModal({ visible, onClose }: PriceManagementModalProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoute, setEditingRoute] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    if (visible) {
      fetchRoutes();
    }
  }, [visible]);

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('origin');

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Error', 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrice = (route: Route) => {
    setEditingRoute(route.id);
    setEditPrice(route.price.toString());
  };

  const handleSavePrice = async (routeId: string) => {
    const newPrice = parseFloat(editPrice);
    
    if (isNaN(newPrice) || newPrice <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    try {
      const { error } = await supabase
        .from('routes')
        .update({ 
          price: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', routeId);

      if (error) throw error;

      // Update local state
      setRoutes(routes.map(route => 
        route.id === routeId 
          ? { ...route, price: newPrice }
          : route
      ));

      setEditingRoute(null);
      setEditPrice('');
      Alert.alert('Success', 'Price updated successfully');
    } catch (error: any) {
      console.error('Error updating price:', error);
      Alert.alert('Error', error.message || 'Failed to update price');
    }
  };

  const handleCancelEdit = () => {
    setEditingRoute(null);
    setEditPrice('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Route Price Management</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {loading ? (
              <Text style={styles.loadingText}>Loading routes...</Text>
            ) : (
              routes.map((route) => (
                <View key={route.id} style={styles.routeCard}>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeText}>
                      {route.origin} → {route.destination}
                    </Text>
                    
                    {editingRoute === route.id ? (
                      <View style={styles.editContainer}>
                        <Text style={styles.currencySymbol}>₦</Text>
                        <TextInput
                          style={styles.priceInput}
                          value={editPrice}
                          onChangeText={setEditPrice}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={Colors.lightGray}
                          autoFocus
                        />
                      </View>
                    ) : (
                      <Text style={styles.priceText}>₦{route.price}</Text>
                    )}
                  </View>

                  <View style={styles.routeActions}>
                    {editingRoute === route.id ? (
                      <>
                        <TouchableOpacity
                          style={styles.saveButton}
                          onPress={() => handleSavePrice(route.id)}
                        >
                          <Save size={16} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={handleCancelEdit}
                        >
                          <X size={16} color={Colors.lightGray} />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditPrice(route)}
                      >
                        <Edit size={16} color={Colors.accent} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.infoCard}>
              <DollarSign size={20} color={Colors.accent} />
              <Text style={styles.infoText}>
                Price changes will be reflected immediately in the booking system
              </Text>
            </View>
          </View>
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
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  closeButton: {
    padding: 5,
  },
  content: {
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
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.accent,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.accent,
    marginRight: 4,
  },
  priceInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 8,
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.accent,
    minWidth: 80,
  },
  routeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: Colors.darkGray,
    padding: 8,
    borderRadius: 6,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.lightGray,
    marginLeft: 8,
    flex: 1,
  },
});