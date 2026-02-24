import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import AITripCreator from '../../components/dashboard/AITripCreator';
import SafetyWidget from '../../components/dashboard/SafetyWidget';
import RecentTrips from '../../components/dashboard/RecentTrips';
import TrendingSuggestions from '../../components/dashboard/TrendingSuggestions';

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto pb-24">
        <DashboardHeader />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2 space-y-8">
            <AITripCreator />
            <SafetyWidget />
          </div>

          {/* Right Column (Sidebar Widgets) */}
          <div className="space-y-8">
            <RecentTrips />
            <TrendingSuggestions />
          </div>


        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
