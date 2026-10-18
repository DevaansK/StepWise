/**
 * StepWise - AI-Assisted College Administrative Service and Process Automation System
 * Main Application Component
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopNav } from './components/layout/TopNav';
import { Sidebar } from './components/layout/Sidebar';
import { DemoWalkthroughModal } from './components/common/DemoWalkthroughModal';

// Student views
import { StudentDashboard } from './components/student/StudentDashboard';
import { ServiceCatalogue } from './components/student/ServiceCatalogue';
import { RequestWizard } from './components/student/RequestWizard';
import { MyRequests } from './components/student/MyRequests';
import { RequestDetailView } from './components/student/RequestDetailView';

// AI Assistant view
import { AIAssistant } from './components/ai/AIAssistant';

// Staff views
import { StaffDashboard } from './components/staff/StaffDashboard';
import { StaffVerificationView } from './components/staff/StaffVerificationView';

// Approver views
import { ApproverDashboard } from './components/approver/ApproverDashboard';
import { ApproverHistoryView } from './components/approver/ApproverHistoryView';

// Admin views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminAllRequests } from './components/admin/AdminAllRequests';
import { AdminServices } from './components/admin/AdminServices';
import { AdminDepartments } from './components/admin/AdminDepartments';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminReports } from './components/admin/AdminReports';

// Shared views
import { NotificationsView } from './components/notifications/NotificationsView';
import { ProfileView } from './components/profile/ProfileView';
import { AuthView } from './components/auth/AuthView';

const MainLayout: React.FC = () => {
  const { activeTab, currentUser } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If in auth screen mode
  if (activeTab === 'auth') {
    return <AuthView />;
  }

  // Render view corresponding to activeTab
  const renderContent = () => {
    switch (activeTab) {
      // Student tabs
      case 'dashboard':
        return <StudentDashboard />;
      case 'services':
      case 'service-detail':
        return <ServiceCatalogue />;
      case 'new-request':
        return <RequestWizard />;
      case 'my-requests':
        return <MyRequests />;
      case 'request-detail':
        return <RequestDetailView />;

      // AI Advisor
      case 'assistant':
        return <AIAssistant />;

      // Department Staff tabs
      case 'staff-assigned':
        return <StaffDashboard />;
      case 'staff-verification':
        return <StaffVerificationView />;

      // Approver tabs
      case 'approver-pending':
        return <ApproverDashboard />;
      case 'approver-history':
        return <ApproverHistoryView />;

      // Admin tabs
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'admin-requests':
        return <AdminAllRequests />;
      case 'admin-services':
        return <AdminServices />;
      case 'admin-departments':
        return <AdminDepartments />;
      case 'admin-users':
        return <AdminUsers />;
      case 'admin-reports':
        return <AdminReports />;

      // Shared tabs
      case 'notifications':
        return <NotificationsView />;
      case 'profile':
        return <ProfileView />;

      default:
        // Default based on current role
        if (currentUser.role === 'STAFF') return <StaffDashboard />;
        if (currentUser.role === 'APPROVER') return <ApproverDashboard />;
        if (currentUser.role === 'ADMIN') return <AdminDashboard />;
        return <StudentDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Role-Aware Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopNav onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>

        {/* Global Demo Walkthrough Modal */}
        <DemoWalkthroughModal />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
