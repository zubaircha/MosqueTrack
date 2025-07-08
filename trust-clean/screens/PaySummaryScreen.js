import React, { useState } from 'react';
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

export default function PaySummaryScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const getMonthString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const handleDownloadPDF = async () => {
    const month = getMonthString(selectedDate);
    const token = await AsyncStorage.getItem('token');
    const url = `https://mosquetrack-production.up.railway.app/api/pay/pdf/?month=${month}`;

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
        console.error('Web PDF download error:', error);
        alert('❌ Failed to download Pay report PDF.');
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
        Alert.alert('✅ Download complete', 'Opening Pay report PDF...');

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('ℹ️ Sharing not available on this device.');
        }
      } catch (error) {
        console.error('Mobile PDF download error:', error);
        Alert.alert('❌ Download failed', 'Could not download Pay report PDF.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Download Monthly Pay Report</Text>

      <Text style={styles.label}>Select Month:</Text>

      {Platform.OS === 'web' ? (
        <input
          type="month"
          value={getMonthString(selectedDate)}
          onChange={(e) => {
            const [year, month] = e.target.value.split('-');
            setSelectedDate(new Date(year, parseInt(month) - 1, 1));
          }}
          style={styles.webInput}
        />
      ) : (
        <>
          <Button
            title={`📅 ${getMonthString(selectedDate)}`}
            onPress={() => setShowPicker(true)}
          />
          {showPicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={(event, selected) => {
                setShowPicker(false);
                if (selected) {
                  setSelectedDate(selected);
                }
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
  container: { flex: 1, padding: 16, marginTop: 30, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontWeight: 'bold', marginBottom: 5 },
  webInput: {
    padding: 10,
    marginVertical: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    width: '100%',
  },
});
