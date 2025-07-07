import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  View,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import api from './api/api';

// Screens
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import DonationListScreen from './screens/DonationListScreen';
import ExpenseListScreen from './screens/ExpenseListScreen';
import FundSummaryScreen from './screens/FundSummaryScreen';
import PaySummaryScreen from './screens/PaySummaryScreen';
import PayReportScreen from './screens/PayReportScreen';
import UnpaidPersonsScreen from './screens/UnpaidPersonsScreen';

// Admin-only stack screens
import CreateDonationScreen from './screens/CreateDonationScreen';
import CreateExpenseScreen from './screens/CreateExpenseScreen';
import CreatePayScreen from './screens/CreatePayScreen';
import CreatePersonScreen from './screens/CreatePersonScreen';
import ApproveUsersScreen from './screens/ApproveUsersScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ isAdmin }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          paddingVertical: Platform.OS === 'web' ? 10 : 6,
          justifyContent: 'center',
        },
        tabBarStyle: {
          height: Platform.OS === 'web' ? 80 : 65,
          paddingBottom: Platform.OS === 'web' ? 16 : 8,
          paddingTop: Platform.OS === 'web' ? 10 : 6,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderColor: '#ccc',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
      }}
    >
      <Tab.Screen name="Home">
        {(props) => <HomeScreen {...props} isAdmin={isAdmin} />}
      </Tab.Screen>
      <Tab.Screen name="Donations" component={DonationListScreen} />
      <Tab.Screen name="Expenses" component={ExpenseListScreen} />     
      <Tab.Screen name="Pay" component={PaySummaryScreen} />
      <Tab.Screen name="unpaid" component={UnpaidPersonsScreen} />
      
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await api.get('/me/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAdmin(res.data.is_staff);
        await AsyncStorage.setItem('is_admin', String(res.data.is_staff));
      } catch (e) {
        console.log('User check error:', e);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="green" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ route, navigation }) => {
          const hiddenHeaderScreens = ['Login', 'Register', 'MainTabs'];
          const showHeader = !hiddenHeaderScreens.includes(route.name);

          return {
            headerShown: showHeader,
            headerRight: () =>
              showHeader && (
                <TouchableOpacity
                  onPress={async () => {
                    await AsyncStorage.clear();
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                  }}
                >
                  <Text
                    style={{
                      color: 'red',
                      fontWeight: 'bold',
                      marginRight: 10,
                    }}
                  >
                    Logout
                  </Text>
                </TouchableOpacity>
              ),
          };
        }}
      >
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs">
          {(props) => <MainTabs {...props} isAdmin={isAdmin} />}
        </Stack.Screen>

        {/* Admin & special use screens (get logout + back automatically) */}
        <Stack.Screen name="Add Donation" component={CreateDonationScreen} />
        <Stack.Screen name="Add Expense" component={CreateExpenseScreen} />
        <Stack.Screen name="Add Pay" component={CreatePayScreen} />
        <Stack.Screen name="Add Person" component={CreatePersonScreen} />
        <Stack.Screen name="Approve Users" component={ApproveUsersScreen} />
        <Stack.Screen name="Fund Summary" component={FundSummaryScreen} />
        <Stack.Screen name="Pay Report" component={PayReportScreen} />
        <Stack.Screen name="Unpaid Persons" component={UnpaidPersonsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
