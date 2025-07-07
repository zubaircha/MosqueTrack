// screens/CreatePersonScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function CreatePersonScreen() {
  const [name, setName] = useState('');

 const handleCreatePerson = async () => {
  console.log('🛠 handleCreatePerson called');

  const token = await AsyncStorage.getItem('token');
  console.log('🔐 Token:', token);

  if (!name.trim()) {
    Alert.alert('Validation Error', 'Please enter a name.');
    console.log('⚠️ Name field is empty');
    return;
  }

  try {
  const res = await api.post('persons/add/', { name }, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
    console.log('✅ Person Created:', res.data);
    Alert.alert('Success', 'Person created');
    setName('');
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.log('❌ Error creating person:', errData);

    if (errData?.name && Array.isArray(errData.name)) {
      Alert.alert('Error', errData.name[0]);
    } else {
      Alert.alert('Error', 'Failed to create person');
    }
  }
};



  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter Person Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="Person name"
        value={name}
        onChangeText={setName}
      />
      <Button title="Create Person" onPress={handleCreatePerson} />
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
});
