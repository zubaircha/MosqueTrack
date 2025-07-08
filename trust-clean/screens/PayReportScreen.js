import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function PayReportScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatMonth = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const handleDownload = async () => {
    const token = await AsyncStorage.getItem('token');
    const month = formatMonth(selectedDate);
    const url = `https://mosquetrack-production.up.railway.app/api/pay/pdf/?month=${month}`; // Replace with your IP

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
        a.download = `Pay_Report_${month}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error('Web download error:', error);
        alert('Failed to download pay report.');
      }
    } else {
      try {
        const fileUri = FileSystem.documentDirectory + `Pay_Report_${month}.pdf`;
        const downloadResumable = FileSystem.createDownloadResumable(
          url,
          fileUri,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { uri } = await downloadResumable.downloadAsync();
        Alert.alert('Download complete', 'Opening Pay Report...');
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        }
      } catch (error) {
        console.error('Mobile download error:', error);
        Alert.alert('Download failed', 'Could not download pay report.');
      }
    }
  };

  // Web input month fallback
  const handleWebMonthChange = (e) => {
    const [year, month] = e.target.value.split('-');
    setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, 1));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Month:</Text>

      {Platform.OS === 'web' ? (
        <input
          type="month"
          onChange={handleWebMonthChange}
          style={{
            fontSize: 16,
            padding: 8,
            marginBottom: 20,
          }}
        />
      ) : (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            if (date) {
              const newDate = new Date(date.getFullYear(), date.getMonth(), 1);
              setSelectedDate(newDate);
            }
          }}
        />
      )}

      <Button
        title="Download Pay Report PDF"
        onPress={handleDownload}
        color="green"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
});
