import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';
import { useIsFocused } from '@react-navigation/native';

export default function HomeScreen({ navigation }) {
  const [isAdmin, setIsAdmin] = useState(null);
  const isFocused = useIsFocused();

  const fetchUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await api.get('/me/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsAdmin(res.data.is_staff);
      console.log('👤 Role:', res.data.is_staff ? 'Admin' : 'User');
    } catch (err) {
      console.error('Error fetching user info:', err);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchUserInfo();
    }
  }, [isFocused]);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  if (isAdmin === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="green" />
      </View>
    );
  }

  return (
  <ScrollView contentContainerStyle={styles.scrollContainer}>
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      
      

      {/* Common Buttons */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Donations')}>
        <Text style={styles.buttonText}>View Donations</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Expenses')}>
        <Text style={styles.buttonText}>View Expenses</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Fund Summary')}>
        <Text style={styles.buttonText}>View Fund Summary</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Pay')}>
        <Text style={styles.buttonText}>View Pay Summary</Text>
      </TouchableOpacity>

      {/* Admin-only Buttons */}
      {isAdmin && (
        <>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Add Donation')}>
            <Text style={styles.buttonText}>Add Donation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Add Expense')}>
            <Text style={styles.buttonText}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Add Pay')}>
            <Text style={styles.buttonText}>Add Pay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Add Person')}>
            <Text style={styles.buttonText}>Add Person</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Approve Users')}>
            <Text style={styles.buttonText}>Approve Users</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={[styles.button, { backgroundColor: 'red' }]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  roleText: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 6,
    marginVertical: 6,
    alignItems: 'center',
    width: 250,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
