import React, { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../api/api';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ExpenseListScreen() {
  const [expenses, setExpenses] = useState([]);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await api.get('pdf/expenses/', {
          params: {
            from: formatDate(fromDate),
            to: formatDate(toDate),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setExpenses(response.data);
      } catch (error) {
        console.error('Failed to load expenses:', error);
      }
    };

    fetchExpenses();
  }, [fromDate, toDate]);

  const handleDownloadPDF = async () => {
    const from = formatDate(fromDate);
    const to = formatDate(toDate);
    const token = await AsyncStorage.getItem('token');
    const url = `http://192.168.100.33:8000/api/pdf/expenses/?from=${from}&to=${to}`;

    if (Platform.OS === 'web') {
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch PDF');

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Expenses_${from}_to_${to}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error('Web PDF download error:', error);
        alert('Failed to download expense PDF.');
      }
    } else {
      try {
        const fileUri = FileSystem.documentDirectory + `expenses_${from}_to_${to}.pdf`;

        const downloadResumable = FileSystem.createDownloadResumable(
          url,
          fileUri,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { uri } = await downloadResumable.downloadAsync();
        Alert.alert('Download complete', 'Opening expenses PDF...');

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('No sharing available on this device.');
        }
      } catch (error) {
        console.error('Mobile PDF download error:', error);
        Alert.alert('Download failed', 'Could not download expenses PDF.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Date Range</Text>

      <Text style={styles.label}>From Date:</Text>
      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={formatDate(fromDate)}
          onChange={(e) => setFromDate(new Date(e.target.value))}
          style={styles.webInput}
        />
      ) : (
        <>
          <Button title={formatDate(fromDate)} onPress={() => setShowFromPicker(true)} />
          {showFromPicker && (
            <DateTimePicker
              value={fromDate}
              mode="date"
              display="default"
              onChange={(event, selected) => {
                setShowFromPicker(false);
                if (selected) setFromDate(selected);
              }}
            />
          )}
        </>
      )}

      <Text style={[styles.label, { marginTop: 12 }]}>To Date:</Text>
      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={formatDate(toDate)}
          onChange={(e) => setToDate(new Date(e.target.value))}
          style={styles.webInput}
        />
      ) : (
        <>
          <Button title={formatDate(toDate)} onPress={() => setShowToPicker(true)} />
          {showToPicker && (
            <DateTimePicker
              value={toDate}
              mode="date"
              display="default"
              onChange={(event, selected) => {
                setShowToPicker(false);
                if (selected) setToDate(selected);
              }}
            />
          )}
        </>
      )}

      <View style={{ marginTop: 20 }}>
        <Button title="Download PDF" onPress={handleDownloadPDF} color="green" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontWeight: 'bold', marginTop: 10 },
  webInput: {
    padding: 10,
    marginVertical: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    width: '100%',
  },
});
