import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

export default function CreateDonationScreen() {
  const [form, setForm] = useState({ name: '', amount: '', description: '' });

  const handleSubmit = async () => {
    if (!form.name || !form.amount) {  
           
          Alert.alert("Error", "Name and amount are required");
          return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await api.post('funds/', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Success', 'Expense added');
      setForm({ name: '', amount: '', description: '' });
    } catch (error) {
      console.error("Error adding donation:", error);
      Alert.alert("Error", "Failed to add donation");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Donor Name"
        value={form.name} onChangeText={text => setForm({ ...form, name: text })} />
      <TextInput style={styles.input} placeholder="Amount" keyboardType="numeric"
        value={form.amount} onChangeText={text => setForm({ ...form, amount: text })} />
      <TextInput style={styles.input} placeholder="Description"
        value={form.description} onChangeText={text => setForm({ ...form, description: text })} />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 12, padding: 10, borderRadius: 5 }
});
