import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

 const handleLogin = async () => {
  if (!username || !password) {
    Alert.alert('Error', 'Please enter username and password');
    return;
  }

  setLoading(true);
  try {
    const res = await api.post('login/', { username, password }); // ✅ correct

    const token = res.data.access;
    await AsyncStorage.setItem('token', token);

    const userRes = await api.get('/me/', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userRes.data.is_approved) {
      Alert.alert('Not Approved', 'Your account is pending admin approval.');
      return;
    }

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err) {
  console.log("🔥 Login error:", err.response?.data);
  Alert.alert(
    'Login Failed',
    err.response?.data?.error || 'Invalid credentials or server error.'
  );
}finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.box}>
          <Text style={styles.title}>Login</Text>

          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          {loading ? (
            <ActivityIndicator size="large" color="green" style={{ marginVertical: 20 }} />
          ) : (
            <>
              <View style={styles.buttonWrapper}>
                <Button title="Login" onPress={handleLogin} />
              </View>
              <View style={styles.buttonWrapper}>
                <Button
                  title="Register"
                  onPress={() => navigation.navigate('Register')}
                  color="gray"
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  box: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#fafafa',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 6,
  },
  buttonWrapper: {
    marginTop: 10,
  },
});
