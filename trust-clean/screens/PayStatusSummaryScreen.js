import React, { useEffect, useState } from 'react';
import { View, Text, Button, Platform, StyleSheet, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function PayStatusSummaryScreen() {
  const [month, setMonth] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [summary, setSummary] = useState([]);

  const formatMonth = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const fetchSummary = async () => {
    const token = await AsyncStorage.getItem('token');
    const selectedMonth = formatMonth(month);
    try {
      const response = await axios.get(`http://192.168.100.33:8000/api/pay/status-summary/?month=${selectedMonth}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(response.data);
    } catch (err) {
      console.error("❌ Error fetching summary", err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [month]);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.name}>{item.person}</Text>
      <Text style={item.paid ? styles.paid : styles.unpaid}>
        {item.paid ? `Paid: Rs ${item.amount}` : 'Not Paid'}
      </Text>
      {item.description ? <Text>Description: {item.description}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pay Status Summary</Text>
      <Text style={styles.label}>Select Month:</Text>

      {Platform.OS === 'web' ? (
        <input
          type="month"
          value={formatMonth(month)}
          onChange={(e) => setMonth(new Date(e.target.value))}
          style={styles.webInput}
        />
      ) : (
        <>
          <Button title={`📅 ${formatMonth(month)}`} onPress={() => setShowPicker(true)} />
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

      <FlatList
        data={summary}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ marginTop: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  label: { fontWeight: 'bold', marginBottom: 5 },
  item: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 6,
  },
  name: { fontWeight: 'bold', fontSize: 16 },
  paid: { color: 'green', marginTop: 4 },
  unpaid: { color: 'red', marginTop: 4 },
  webInput: {
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
});
