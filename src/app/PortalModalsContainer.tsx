import React from 'react';
import { IntroSplashScreen } from '../components/IntroSplashScreen';
import { StudentDetailModal } from '../features/students/StudentDetailModal';
import { PrintableReportModal } from '../features/attendance/PrintableReportModal';
import { SettingsModal } from '../components/SettingsModal';
import { CohortManagementModal } from '../components/CohortManagementModal';
import { AdminAuditAndBackupModal } from '../components/AdminAuditAndBackupModal';
import { MobileDownloadCenterModal } from '../components/MobileDownloadCenterModal';
import { GuideModal } from '../components/shared/GuideModal';
import { BatchAnnouncementModal } from '../components/BatchAnnouncementModal';
import { SupabaseDiagnosticModal } from '../components/SupabaseDiagnosticModal';
import { StudentTranscriptModal } from '../features/students/StudentTranscriptModal';
import { CertificateModal } from '../features/students/CertificateModal';
import { BatchEmailModal } from '../features/attendance/BatchEmailModal';
import { LoginModal } from '../components/LoginModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { UserManagementModal } from '../components/UserManagementModal';
import { PINCheckinQRModal } from '../components/PINCheckinQRModal';
import { AppPresentationModal } from '../components/AppPresentationModal';
import { SheetMergeConflictModal } from '../components/SheetMergeConflictModal';
import { ManageClassDaysModal } from '../components/ManageClassDaysModal';
import { CommandPaletteModal } from '../components/CommandPaletteModal';

export interface PortalModalsContainerProps {
  state: ReturnType<typeof import('./usePortalState').usePortalState>;
}

export function PortalModalsContainer({ state }: PortalModalsContainerProps) {
  return (
    <>
      {state.showIntro && (
        <IntroSplashScreen
          appUser={state.appUser}
          onComplete={() => {
            sessionStorage.setItem('hteim_intro_shown', 'true');
            state.setShowIntro(false);
          }}
        />
      )}

      {state.showLoginModal && (
        <LoginModal
          isOpen={state.showLoginModal}
          currentUser={state.appUser}
          onLoginSuccess={state.handleAppLoginSuccess}
          onLogout={state.handleAppLogout}
          onClose={() => state.setShowLoginModal(false)}
          userCredentials={state.userCredentials}
          onChangePassword={state.handleChangeUserPassword}
          onSyncCredentials={(syncedCreds) => state.setUserCredentials(syncedCreds)}
          onOpenResetModal={(email) => {
            state.setResetTargetEmail(email);
            state.setShowLoginModal(false);
            state.setShowResetPasswordModal(true);
          }}
        />
      )}

      {state.showResetPasswordModal && (
        <ResetPasswordModal
          isOpen={state.showResetPasswordModal}
          onClose={() => {
            state.setShowResetPasswordModal(false);
            state.setIsResetFromEmailLink(false);
          }}
          targetUserEmail={state.resetTargetEmail}
          userCredentials={state.userCredentials}
          isFromEmailLink={state.isResetFromEmailLink}
          onBackToLogin={() => {
            state.setShowResetPasswordModal(false);
            state.setIsResetFromEmailLink(false);
            state.setShowLoginModal(true);
          }}
          onResetComplete={(authenticatedUser) => {
            state.setAppUser(authenticatedUser);
            state.setShowResetPasswordModal(false);
            state.setIsResetFromEmailLink(false);
            state.setShowLoginModal(false);
            state.setSyncedBannerMessage(`🔐 Password Updated! Welcome back, ${authenticatedUser.name}`);
            setTimeout(() => state.setSyncedBannerMessage(''), 5000);
          }}
        />
      )}

      {state.showSettingsModal && (
        <SettingsModal
          isOpen={state.showSettingsModal}
          onClose={() => state.setShowSettingsModal(false)}
          userRole={state.appUser?.role || 'user'}
          atRiskThreshold={state.atRiskThreshold}
          setAtRiskThreshold={state.setAtRiskThreshold}
          satisfactoryThreshold={state.satisfactoryThreshold}
          setSatisfactoryThreshold={state.setSatisfactoryThreshold}
          autoSyncInterval={state.autoSyncInterval}
          setAutoSyncInterval={state.setAutoSyncInterval}
          syncOnTabFocus={state.syncOnTabFocus}
          setSyncOnTabFocus={state.setSyncOnTabFocus}
          sheetMergePolicy={state.sheetMergePolicy}
          setSheetMergePolicy={state.setSheetMergePolicy}
          themeMode={state.themeMode}
          setThemeMode={state.setThemeMode}
          onExportBackup={state.handleExportBackup}
          onImportBackup={state.handleImportBackup}
          onResetAllData={state.handleResetAllData}
          onOpenGuide={() => state.setShowGuideModal(true)}
          onOpenMobileDownloadCenter={() => state.setShowMobileDownloadModal(true)}
          onOpenAdminTools={() => {
            state.setShowSettingsModal(false);
            state.setShowAdminAuditModal(true);
          }}
          onOpenCohortManager={state.appUser?.role === 'admin' ? () => state.setShowCohortModal(true) : undefined}
          onPhotosMigrated={state.handlePushToCloud}
        />
      )}

      {state.showCohortModal && (
        <CohortManagementModal
          isOpen={state.showCohortModal}
          onClose={() => state.setShowCohortModal(false)}
          cohorts={state.cohorts}
          activeCohortId={state.activeCohortId}
          onSelectActiveCohort={(id) => {
            const target = state.cohorts.find(c => c.id === id);
            if (state.appUser?.role !== 'admin' && target && !target.isCurrent) {
              state.showToast('error', 'Access Denied', 'The new cohort is restricted to institutional administrators.');
              return;
            }
            state.setActiveCohortId(id);
            state.setShowCohortModal(false);
          }}
          onSaveCohort={state.handleSaveCohort}
          onDeleteCohort={state.handleDeleteCohort}
          onArchiveToggle={state.handleArchiveToggleCohort}
          students={state.uniqueStudents}
          courses={state.courses}
          userRole={state.appUser?.role || 'user'}
          onAssignStudentCohort={state.handleAssignStudentCohort}
        />
      )}

      {state.showAdminAuditModal && (
        <AdminAuditAndBackupModal
          isOpen={state.showAdminAuditModal}
          onClose={() => state.setShowAdminAuditModal(false)}
          currentUserRole={state.appUser?.role}
          currentActorName={state.appUser ? (state.appUser.role === 'admin' ? 'Administrator' : state.appUser.name) : 'Administrator'}
          onDataRestored={() => {
            state.handlePushToCloud();
          }}
          userCredentials={state.userCredentials}
          onResetPassword={state.handleChangeUserPassword}
        />
      )}

      {state.showMobileDownloadModal && (
        <MobileDownloadCenterModal
          isOpen={state.showMobileDownloadModal}
          onClose={() => state.setShowMobileDownloadModal(false)}
        />
      )}

      {state.showGuideModal && (
        <GuideModal
          isOpen={state.showGuideModal}
          onClose={() => state.setShowGuideModal(false)}
        />
      )}

      {state.showBatchBroadcastModal && (
        <BatchAnnouncementModal
          isOpen={state.showBatchBroadcastModal}
          onClose={() => state.setShowBatchBroadcastModal(false)}
          availableStudents={state.uniqueStudents.map(s => ({
            name: s.name,
            email: `${(s.name || '').toLowerCase().replace(/\s+/g, '.')}@hteim.edu`,
            phone: '+1 (868) 555-0199',
            track: 'Active Ministry Module'
          }))}
          onSendBroadcast={state.handleSendBatchBroadcast}
        />
      )}

      {state.showDiagnosticModal && (
        <SupabaseDiagnosticModal
          isOpen={state.showDiagnosticModal}
          onClose={() => state.setShowDiagnosticModal(false)}
          userEmail={state.appUser?.email || state.user?.email}
          userRole={state.appUser?.role}
          onRefreshData={state.handlePushToCloud}
        />
      )}

      {state.showStudentTranscriptModal && state.selectedStudent && (
        <StudentTranscriptModal
          isOpen={state.showStudentTranscriptModal}
          onClose={() => state.setShowStudentTranscriptModal(false)}
          selectedStudent={state.selectedStudent}
          effectiveClassDays={state.effectiveClassDays}
          rubricScores={state.rubricScores}
          excusedAbsences={state.excusedAbsences}
          satisfactoryThreshold={state.satisfactoryThreshold}
          atRiskThreshold={state.atRiskThreshold}
          isGeneratingPDF={state.isGeneratingPDF}
          handleExportPDF={state.handleExportPDF}
          handleToggleStudentAttendance={state.handleToggleStudentAttendance}
          appUser={state.appUser}
        />
      )}

      {state.showCertificateModal && state.certificateData && (
        <CertificateModal
          isOpen={state.showCertificateModal}
          onClose={() => {
            state.setShowCertificateModal(false);
            state.setCertificateData(null);
          }}
          certificateData={state.certificateData}
          isGeneratingPDF={state.isGeneratingPDF}
          handleExportPDF={state.handleExportPDF}
        />
      )}

      {state.showBatchEmailModal && (
        <BatchEmailModal
          isOpen={state.showBatchEmailModal}
          onClose={() => state.setShowBatchEmailModal(false)}
          selectedStudentNames={state.selectedStudentNames}
          uniqueStudents={state.uniqueStudents}
          effectiveClassDays={state.effectiveClassDays}
          atRiskThreshold={state.atRiskThreshold}
          clearBatchSelection={() => state.setSelectedStudentNames([])}
        />
      )}

      {state.showUserManagementModal && (
        <UserManagementModal
          isOpen={state.showUserManagementModal}
          onClose={() => state.setShowUserManagementModal(false)}
          userCredentials={state.userCredentials}
          onUpdateCredentials={async (updatedCreds) => {
            state.setUserCredentials(updatedCreds);
            try {
              localStorage.setItem('hteim_user_credentials', JSON.stringify(updatedCreds));
            } catch (e) {}
          }}
          uniqueStudents={state.uniqueStudents}
          facultyTeachers={state.facultyTeachers}
          currentAdminEmail="kpierre24@gmail.com"
          onTriggerCloudSync={state.handlePushToCloud}
          appUser={state.appUser}
        />
      )}

      {state.showPINCheckinModal && (
        <PINCheckinQRModal
          classDayName={state.effectiveClassDays[0]?.name || 'Current Class Day'}
          classDayId={state.effectiveClassDays[0]?.id || 'day_1'}
          onClose={() => state.setShowPINCheckinModal(false)}
          onStudentCheckedIn={(studentName, classDayId) => state.handleToggleStudentAttendance(studentName, classDayId, 'present')}
        />
      )}

      {state.showPresentationModal && (
        <AppPresentationModal
          isOpen={state.showPresentationModal}
          onClose={() => state.setShowPresentationModal(false)}
          onNavigateTab={(tab) => state.setActiveErpTab(tab)}
        />
      )}

      {state.pendingConflicts.length > 0 && (
        <SheetMergeConflictModal
          isOpen={state.pendingConflicts.length > 0}
          conflicts={state.pendingConflicts}
          onResolve={state.handleResolveConflicts}
          onCancel={() => {
            state.setPendingConflicts([]);
            state.setPendingSyncData(null);
          }}
        />
      )}

      {state.showClassDaysModal && (
        <ManageClassDaysModal
          isOpen={state.showClassDaysModal}
          onClose={() => state.setShowClassDaysModal(false)}
          classDays={state.classDays}
          onAddClassDay={state.handleAddClassDay}
          onEditClassDayTitle={state.handleEditClassDayTitle}
          onDeleteClassDay={state.handleDeleteClassDay}
          onClearClassDayRecords={state.handleClearClassDayRecords}
          uniqueStudentsCount={state.uniqueStudents.length}
          classDayStats={state.classDayStats}
        />
      )}

      {state.showCommandPalette && (
        <CommandPaletteModal
          isOpen={state.showCommandPalette}
          onClose={() => state.setShowCommandPalette(false)}
          onNavigate={(tab) => state.setActiveErpTab(tab)}
          appUser={state.appUser}
          studentList={state.uniqueStudents.map(s => ({
            name: s.name,
            rate: s.rate,
            levelId: s.levelId,
            studentId: state.getStudentIdForName(s.name)
          }))}
          paymentList={state.payments.map(p => ({
            name: p.studentName,
            status: p.status,
            track: p.moduleTrack
          }))}
          onOpenSettings={() => state.setShowSettingsModal(true)}
          onOpenAdminTools={() => state.setShowAdminAuditModal(true)}
          onOpenBatchBroadcast={() => state.setShowBatchBroadcastModal(true)}
          onOpenMobileDownload={() => state.setShowMobileDownloadModal(true)}
          onOpenLogin={() => state.setShowLoginModal(true)}
        />
      )}

      {state.selectedStudent && (
        <StudentDetailModal
          selectedStudent={state.selectedStudent}
          onClose={() => state.setSelectedStudent(null)}
          studentNotes={state.studentNotes}
          excusedAbsences={state.excusedAbsences}
          effectiveClassDays={state.effectiveClassDays}
          classDays={state.classDays}
          studentPhotos={state.studentPhotos}
          satisfactoryThreshold={state.satisfactoryThreshold}
          atRiskThreshold={state.atRiskThreshold}
          getStudentBadges={state.getStudentBadges}
          rubricScores={state.rubricScores}
          setRubricScores={state.setRubricScores}
          onOpenTranscript={() => state.setShowStudentTranscriptModal(true)}
          onOpenCertificate={(certData) => {
            state.setCertificateData(certData);
            state.setShowCertificateModal(true);
          }}
          handleToggleStudentAttendance={state.handleToggleStudentAttendance}
          handleToggleExcusedAbsence={state.handleToggleExcusedAbsence}
          handleSaveStudentNote={state.handleSaveStudentNote}
          handleDeleteStudent={state.handleDeleteStudent}
          handleClearStudentAttendanceRecords={state.handleClearStudentAttendanceRecords}
          appUser={state.appUser}
        />
      )}

      {state.showReportModal && (
        <PrintableReportModal
          isOpen={state.showReportModal}
          onClose={() => state.setShowReportModal(false)}
          uniqueStudents={state.uniqueStudents}
          effectiveClassDays={state.effectiveClassDays}
          atRiskThreshold={state.atRiskThreshold}
          satisfactoryThreshold={state.satisfactoryThreshold}
          isGeneratingPDF={state.isGeneratingPDF}
          handleExportPDF={state.handleExportPDF}
          selectedReportAttendanceFilter={state.selectedReportAttendanceFilter}
          setSelectedReportAttendanceFilter={state.setSelectedReportAttendanceFilter}
        />
      )}
    </>
  );
}
