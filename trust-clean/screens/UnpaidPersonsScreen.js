import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Platform, Button } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const UnpaidPersonsScreen = () => {
  const [month, setMonth] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatMonth = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const fetchUnpaidPersons = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const formattedMonth = formatMonth(month);

      const response = await axios.get(
        `http://192.168.100.33:8000/api/pay/unpaid/?month=${formattedMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setData(response.data.unpaid);
    } catch (error) {
      console.error('Error fetching unpaid persons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaidPersons();
  }, [month]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.status}>Status: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Unpaid Persons</Text>

      {Platform.OS === 'web' ? (
        <input
          type="month"
          value={formatMonth(month)}
          onChange={(e) => setMonth(new Date(e.target.value))}
          style={styles.webInput}
        />
      ) : (
        <>
          <Button
            title={`📅 Month: ${formatMonth(month)}`}
            onPress={() => setShowPicker(true)}
          />
          {showPicker && (
            <DateTimePicker
              value={month}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowPicker(false);
                if (selectedDate) setMonth(selectedDate);
              }}
            />
          )}
        </>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text>No unpaid persons found.</Text>}
        />
      )}
    </View>
  );
};

export default UnpaidPersonsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: 'bold' },
  status: { fontSize: 16, color: 'red' },
  webInput: {
    padding: 10,
    marginBottom: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
  },
});
