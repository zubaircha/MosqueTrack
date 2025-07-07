import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, Platform, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreatePayScreen() {
  const [persons, setPersons] = useState([]);
  const [form, setForm] = useState({
    person: '',
    amount: '',
    description: '',
    month: '',
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`; // only year-month needed
  };

  useEffect(() => {
    const fetchPersons = async () => {
      const token = await AsyncStorage.getItem('token');
      try {
        const response = await api.get('/persons/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPersons(response.data);
      } catch (error) {
        console.error('Error fetching persons:', error);
      }
    };
    fetchPersons();
  }, []);

  const handleSubmit = async () => {
    if (!form.person || !form.amount || !form.month) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await api.post('/pay/', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Success', 'Pay added successfully');
      setForm({ person: '', amount: '', description: '', month: '' });
      setSelectedDate(new Date());
    } catch (err) {
      console.error('Error submitting pay:', err);
      Alert.alert('Error', 'Failed to add pay');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Person</Text>
      <Picker
        selectedValue={form.person}
        onValueChange={(itemValue) => setForm({ ...form, person: itemValue })}
        style={styles.picker}
      >
        <Picker.Item label="Select person..." value="" />
        {persons.map((p) => (
          <Picker.Item key={p.id} label={p.name} value={p.id} />
        ))}
      </Picker>

      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="numeric"
        value={form.amount}
        onChangeText={(text) => setForm({ ...form, amount: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={form.description}
        onChangeText={(text) => setForm({ ...form, description: text })}
      />

      <Text style={styles.label}>Select Month</Text>
      {Platform.OS === 'web' ? (
        <input
          type="month"
          value={form.month}
          onChange={(e) => setForm({ ...form, month: e.target.value })}
          style={styles.webInput}
        />
      ) : (
        <>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            <Text>{form.month ? form.month : 'Select month'}</Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setSelectedDate(date);
                  setForm({ ...form, month: formatDate(date) });
                }
              }}
            />
          )}
        </>
      )}

      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { fontWeight: 'bold', marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    padding: 10,
    borderRadius: 5,
  },
  picker: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  webInput: {
    padding: 10,
    marginBottom: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
  dateButton: {
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 5,
    marginBottom: 12,
  },
});
