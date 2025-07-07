import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

const ApproveUsersScreen = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
  const token = await AsyncStorage.getItem('token');
  const response = await api.get('admin/pending-users/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  setPendingUsers(response.data);
} catch (error) {
  console.error('❌ Failed to fetch pending users:', error);
}
 finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      await api.post(`admin/approve-user/${userId}/`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      Alert.alert('Success', 'User approved');
      fetchPendingUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve user');
    }
  };

  const declineUser = async (userId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      await api.post(`admin/decline-user/${userId}/`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      Alert.alert('User Declined', 'User has been removed.');
      fetchPendingUsers();
    } catch (error) {
      console.error('Decline error:', error);
      Alert.alert('Error', 'Failed to decline user.');
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.userBox}>
      <Text style={styles.username}>{item.username}</Text>
      <Text style={styles.mobile}>📱 {item.mobile_number}</Text>
      <View style={styles.buttonRow}>
        <Button title="Approve" color="green" onPress={() => approveUser(item.id)} />
        <View style={{ width: 10 }} />
        <Button title="Decline" color="red" onPress={() => declineUser(item.id)} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending User Approvals</Text>
      {loading ? (
        <ActivityIndicator size="large" color="green" />
      ) : pendingUsers.length === 0 ? (
        <Text style={styles.noUsers}>No pending users</Text>
      ) : (
        <FlatList
          data={pendingUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUser}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  userBox: {
    padding: 15,
    backgroundColor: '#e0f7e9',
    borderRadius: 10,
    marginBottom: 10
  },
  username: { fontSize: 18, fontWeight: '600' },
  mobile: { fontSize: 14, marginBottom: 10 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  noUsers: { fontSize: 16, color: 'gray', marginTop: 20 }
});

export default ApproveUsersScreen;
