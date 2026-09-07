import React from 'react';
import { AppProviders } from './providers';
import { AppRoutes } from './AppRoutes';
import { AppHeader } from '../components/AppHeader';
import { PortalFooter, MobileBottomNav } from '../components/layout';
import { IntroSplashScreen } from '../components/IntroSplashScreen';
import { OutstandingPaymentBanner } from '../components/OutstandingPaymentBanner';
import { CommandPaletteModal } from '../components/CommandPaletteModal';
import { LoginModal } from '../components/LoginModal';
import { SettingsModal } from '../components/SettingsModal';
import { RoleManagementModal } from '../components/RoleManagementModal';
import { UserManagementModal } from '../components/UserManagementModal';
import { SupabaseDiagnosticModal } from '../components/SupabaseDiagnosticModal';
import { MobileMoreMenuDrawer } from '../components/layout/MobileMoreMenuDrawer';
import { OfflineSyncDrawer } from '../components/OfflineSyncDrawer';
import { AppPresentationModal } from '../components/AppPresentationModal';
import { PINCheckinQRModal } from '../components/PINCheckinQRModal';
import { GuideModal } from '../components/shared/GuideModal';
import { usePortalState } from '../hooks/usePortalState';

/**
 * HTEIM School of Ministry Portal — Core Application Root
 * 
 * Clean, modular orchestrator handling:
 * 1. Providers (Theme, Error Boundaries)
 * 2. Routing & View Swapping (AppRoutes)
 * 3. Global Layout (AppHeader, PortalFooter, MobileBottomNav)
 * 4. Authentication State & User Role Management
 * 5. High-level Navigation & Modals
 */
export function AppShell() {
  const portal = usePortalState();

  if (portal.showIntro) {
    return <IntroSplashScreen onComplete={() => portal.setShowIntro(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 antialiased selection:bg-amber-500 selection:text-white">
      {/* Dynamic Sync & Alert Banner */}
      {portal.syncedBannerMessage && (
        <div className="bg-amber-500 text-white text-xs font-bold py-2 px-4 text-center shadow-sm flex items-center justify-center gap-2 animate-fadeIn z-50">
          <span>{portal.syncedBannerMessage}</span>
        </div>
      )}

      {/* Outstanding Tuition Payment Alert Banner (Student Accounts Only) */}
      {portal.showOutstandingPaymentBanner && portal.studentPaymentSummary && (
        <OutstandingPaymentBanner
          summary={portal.studentPaymentSummary}
          onViewStatement={() => portal.handleNavigate('payments')}
          onClose={() => portal.setShowOutstandingPaymentBanner(false)}
        />
      )}

      {/* Global Application Navigation Header */}
      <AppHeader
        activeCohort={null}
        onOpenCohortModal={() => {}}
        onGoHome={() => portal.handleNavigate('home')}
        appUser={portal.appUser}
        onOpenLogin={() => portal.setShowLoginModal(true)}
        onLogout={portal.handleAppLogout}
        onNavigate={portal.handleNavigate}
        unreadMessagesCount={0}
        filteredNotifications={portal.notifications}
        onMarkNotifAsRead={() => {}}
        onMarkAllNotifsAsRead={() => {}}
        onClearNotifs={() => {}}
        onSelectNotif={() => {}}
        onTriggerNotifScan={() => {}}
        onAddTestNotif={() => {}}
        onOpenIntro={() => portal.setShowIntro(true)}
        onOpenPresentation={() => portal.setShowPresentationModal(true)}
        onOpenCommandPalette={() => portal.setShowCommandPalette(true)}
        onOpenRoleSwitch={() => portal.setShowRoleMenu(true)}
        isCloudSyncing={false}
        onPushToCloud={() => {}}
        dataSource="Supabase Cloud"
        isLoading={false}
        onLoadSheets={() => {}}
        onOpenBroadcast={() => {}}
        onOpenAuditLog={() => portal.setShowAdminAuditModal(true)}
        onOpenUserManagement={() => portal.setShowUserManagementModal(true)}
        onOpenSettings={() => portal.setShowSettingsModal(true)}
        onOpenHelp={() => portal.setShowGuideModal(true)}
        onToggleMobileDrawer={() => portal.setShowMobileMoreMenu(true)}
        onOpenOfflineDrawer={() => portal.setShowOfflineDrawer(true)}
        onOpenPINCheckin={() => portal.setShowPINCheckinModal(true)}
      />

      {/* Main Portal Content Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <AppRoutes
          currentTab={portal.activeErpTab}
          userRole={portal.appUser?.role || 'guest'}
          onNavigate={portal.handleNavigate}
          homeProps={{
            appUser: portal.appUser,
            onNavigate: portal.handleNavigate,
            facultyTeachers: portal.facultyTeachers,
            announcements: portal.messages
          }}
          attendanceProps={{
            appUser: portal.appUser,
            records: portal.records,
            classDays: portal.classDays,
            setRecords: portal.setRecords,
            setStudentNotes: portal.setStudentNotes,
            setExcusedAbsences: portal.setExcusedAbsences,
            handleNavigate: portal.handleNavigate
          }}
          studentsProps={{
            appUser: portal.appUser,
            uniqueStudents: portal.records,
            studentPhotos: portal.studentPhotos,
            studentLevels: portal.studentLevels,
            onNavigate: portal.handleNavigate
          }}
          paymentsProps={{
            appUser: portal.appUser,
            payments: portal.payments,
            setPayments: portal.setPayments
          }}
          coursesProps={{
            appUser: portal.appUser,
            courses: portal.courses,
            schedules: portal.schedules
          }}
          examsProps={{
            appUser: portal.appUser,
            customAssignments: portal.customAssignments,
            submissions: portal.submissions,
            setSubmissions: portal.setSubmissions
          }}
          scheduleProps={{
            appUser: portal.appUser,
            schedules: portal.schedules
          }}
          libraryProps={{
            appUser: portal.appUser,
            libraryResources: portal.libraryResources,
            classroomMedia: portal.classroomMedia
          }}
          messagesProps={{
            appUser: portal.appUser,
            messages: portal.messages,
            setMessages: portal.setMessages
          }}
          reportsProps={{
            appUser: portal.appUser,
            records: portal.records,
            classDays: portal.classDays
          }}
          notesProps={{
            appUser: portal.appUser
          }}
        />
      </main>

      {/* Portal Footer */}
      <PortalFooter
        appUser={portal.appUser}
        onOpenGuide={() => portal.setShowGuideModal(true)}
        onOpenSettings={() => portal.setShowSettingsModal(true)}
      />

      {/* Mobile Bottom Dock Navigation */}
      <MobileBottomNav
        appUser={portal.appUser}
        activeErpTab={portal.activeErpTab}
        handleNavigate={portal.handleNavigate}
        showMobileMoreMenu={portal.showMobileMoreMenu}
        setShowMobileMoreMenu={portal.setShowMobileMoreMenu}
        unreadMessagesCount={0}
      />

      {/* Global Modals Stack */}
      {portal.showLoginModal && (
        <LoginModal
          isOpen={portal.showLoginModal}
          onLoginSuccess={portal.handleAppLoginSuccess}
          onLogout={portal.handleAppLogout}
          onClose={() => portal.setShowLoginModal(false)}
          userCredentials={portal.userCredentials}
          onChangePassword={async () => {}}
          onSyncCredentials={(synced) => portal.setUserCredentials(synced)}
        />
      )}

      {portal.showRoleMenu && (
        <RoleManagementModal
          isOpen={portal.showRoleMenu}
          onClose={() => portal.setShowRoleMenu(false)}
          currentUser={portal.appUser}
          onSwitchRole={portal.handleQuickRoleSwitch}
        />
      )}

      {portal.showSettingsModal && (
        <SettingsModal
          isOpen={portal.showSettingsModal}
          onClose={() => portal.setShowSettingsModal(false)}
          userRole={portal.appUser?.role || 'admin'}
          atRiskThreshold={75}
          setAtRiskThreshold={() => {}}
          satisfactoryThreshold={85}
          setSatisfactoryThreshold={() => {}}
          autoSyncInterval={5}
          setAutoSyncInterval={() => {}}
          syncOnTabFocus={true}
          setSyncOnTabFocus={() => {}}
          sheetMergePolicy="manual"
          setSheetMergePolicy={() => {}}
          themeMode="light"
          setThemeMode={() => {}}
          onExportBackup={() => {}}
          onImportBackup={() => true}
          onResetAllData={() => {}}
          onOpenGuide={() => portal.setShowGuideModal(true)}
          onOpenMobileDownloadCenter={() => {}}
          onOpenAdminTools={() => {
            portal.setShowSettingsModal(false);
            portal.setShowAdminAuditModal(true);
          }}
          onOpenCohortManager={() => {}}
          onPhotosMigrated={() => {}}
        />
      )}

      {portal.showCommandPalette && (
        <CommandPaletteModal
          isOpen={portal.showCommandPalette}
          onClose={() => portal.setShowCommandPalette(false)}
          onNavigate={portal.handleNavigate}
          appUser={portal.appUser}
          studentList={[]}
          onOpenSettings={() => portal.setShowSettingsModal(true)}
          onOpenAdminTools={() => portal.setShowAdminAuditModal(true)}
          onOpenBatchBroadcast={() => {}}
          onOpenMobileDownload={() => {}}
          onOpenLogin={() => portal.setShowLoginModal(true)}
        />
      )}

      {portal.showDiagnosticModal && (
        <SupabaseDiagnosticModal
          isOpen={portal.showDiagnosticModal}
          onClose={() => portal.setShowDiagnosticModal(false)}
          userEmail={portal.appUser?.email}
          userRole={portal.appUser?.role}
          onRefreshData={async () => {}}
        />
      )}

      {portal.showUserManagementModal && (
        <UserManagementModal
          isOpen={portal.showUserManagementModal}
          onClose={() => portal.setShowUserManagementModal(false)}
          userCredentials={portal.userCredentials}
          onUpdateCredentials={(updated) => portal.setUserCredentials(updated)}
          uniqueStudents={[]}
          facultyTeachers={portal.facultyTeachers}
          currentAdminEmail="kpierre24@gmail.com"
          onTriggerCloudSync={async () => {}}
        />
      )}

      {portal.showMobileMoreMenu && (
        <MobileMoreMenuDrawer
          isOpen={portal.showMobileMoreMenu}
          onClose={() => portal.setShowMobileMoreMenu(false)}
          activeErpTab={portal.activeErpTab}
          setActiveErpTab={portal.handleNavigate}
          appUser={portal.appUser}
          uniqueStudentsCount={0}
          unreadMessagesCount={0}
          setShowLoginModal={portal.setShowLoginModal}
          setShowLiveCheckinModal={portal.setShowLiveCheckinModal}
          liveCheckinDayId={portal.liveCheckinDayId}
          setLiveCheckinDayId={portal.setLiveCheckinDayId}
          classDays={portal.classDays}
          setShowIntro={portal.setShowIntro}
          setShowCommandPalette={portal.setShowCommandPalette}
          setShowSettingsModal={portal.setShowSettingsModal}
          setShowRoleMenu={portal.setShowRoleMenu}
        />
      )}

      {portal.showOfflineDrawer && (
        <OfflineSyncDrawer
          isOpen={portal.showOfflineDrawer}
          onClose={() => portal.setShowOfflineDrawer(false)}
          isOnline={true}
          onTriggerFullSync={async () => {}}
        />
      )}

      {portal.showPresentationModal && (
        <AppPresentationModal
          isOpen={portal.showPresentationModal}
          onClose={() => portal.setShowPresentationModal(false)}
          onNavigateTab={portal.handleNavigate}
        />
      )}

      {portal.showPINCheckinModal && (
        <PINCheckinQRModal
          classDayName={portal.classDays[0]?.name || "Classroom Session"}
          classDayId={portal.classDays[0]?.id || "day_1"}
          onClose={() => portal.setShowPINCheckinModal(false)}
        />
      )}

      {portal.showGuideModal && (
        <GuideModal
          isOpen={portal.showGuideModal}
          onClose={() => portal.setShowGuideModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
