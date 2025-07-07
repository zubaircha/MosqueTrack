// trust-clean/screens/CreateExpenseScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

export default function CreateExpenseScreen({ navigation }) {
  const [form, setForm] = useState({
  name: '',
  description: '',
  amount: '',
});

  const handleSubmit = async () => {
    if (!form.name || !form.amount) {  
           
          Alert.alert("Error", "Name and amount are required");
          return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await api.post('/expenses/', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Success', 'Expense added');
      setForm({ name: '',  description: '', amount: '' });
      navigation.goBack();
    } catch (err) {
      console.log("expense testing")
      console.error('Error:', err.response?.data || err.message);
      Alert.alert('Error', 'Could not add expense');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Name"
  value={form.name} onChangeText={(text) => setForm({ ...form, name: text })}
/>
<TextInput style={styles.input} placeholder="Description"
  value={form.description} onChangeText={(text) => setForm({ ...form, description: text })}
/>
<TextInput style={styles.input} placeholder="Amount" keyboardType="numeric"
  value={form.amount} onChangeText={(text) => setForm({ ...form, amount: text })}
/>
      <Button title="Save" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 12, padding: 10, borderRadius: 5 },
});
