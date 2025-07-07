import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './screens/HomeScreen';
import DonationListScreen from './screens/DonationListScreen';
import ExpenseListScreen from './screens/ExpenseListScreen';
import FundSummaryScreen from './screens/FundSummaryScreen';
import PaySummaryScreen from './screens/PaySummaryScreen';
import PayReportScreen from './screens/PayReportScreen';
import UnpaidPersonsScreen from './screens/UnpaidPersonsScreen'; // visible in tabs

const Tab = createBottomTabNavigator();

export default function MainTabs({ isAdmin }) {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Home">
        {(props) => <HomeScreen {...props} isAdmin={isAdmin} />}
      </Tab.Screen>
      <Tab.Screen name="Donations" component={DonationListScreen} />
      <Tab.Screen name="Expenses" component={ExpenseListScreen} />
      <Tab.Screen name="Pay" component={PaySummaryScreen} />
      <Tab.Screen name="Fund Summary" component={FundSummaryScreen} />
      <Tab.Screen name="Pay Report" component={PayReportScreen} />
      <Tab.Screen name="Unpaid Persons" component={UnpaidPersonsScreen} />
    </Tab.Navigator>
  );
}
