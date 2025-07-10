import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import api from '../api/api';  // ✅ correct


export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirm_password: '',
    mobile_number: '',
  });

  const handleRegister = async () => {
  try {
    console.log("Sending form:", form);
    const response = await api.post('register/', form); // ✅ no starting slash
    Alert.alert('Success', 'Registered! Wait for approval.');
    navigation.navigate('Login');
  } catch (error) {
    console.log("❌ error:", error);
    console.log("❌ error.response:", error.response);
    console.log("❌ error.request:", error.request);
    console.log("❌ error.message:", error.message);   
    Alert.alert("Error", JSON.stringify(error.response?.data || error.message));

  }
};


  return (
    <View style={styles.outer}>
      <View style={styles.container}>
        <Text style={styles.title}>Register</Text>
        <TextInput style={styles.input} placeholder="Username"
          value={form.username} onChangeText={text => setForm({ ...form, username: text })}
        />
        <TextInput style={styles.input} placeholder="Mobile Number"
          keyboardType="phone-pad"
          value={form.mobile_number} onChangeText={text => setForm({ ...form, mobile_number: text })}
        />
        <TextInput style={styles.input} placeholder="Password"
          secureTextEntry
          value={form.password} onChangeText={text => setForm({ ...form, password: text })}
        />
        <TextInput style={styles.input} placeholder="Confirm Password"
          secureTextEntry
          value={form.confirm_password} onChangeText={text => setForm({ ...form, confirm_password: text })}
        />
        <Button title="Register" onPress={handleRegister} />
        <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
          Already have an account? Login
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    padding: 10,
    borderRadius: 5
  },
  link: {
    marginTop: 10,
    color: 'blue',
    textAlign: 'center'
  }
});
