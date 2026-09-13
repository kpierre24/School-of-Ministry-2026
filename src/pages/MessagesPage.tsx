import React, { Suspense } from 'react';
import { LazyMessagesTab } from '../components/tabs';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DashboardSkeleton } from '../components/DashboardSkeleton';

export interface MessagesPageProps {
  appUser: any;
  messages: any[];
  onSendMessage: (msg: any) => Promise<boolean> | boolean | void;
  onReplyMessage: (threadId: string, reply: any) => Promise<boolean> | boolean | void;
  onUpdateStatus: (messageId: string, status: any) => void;
  onDeleteMessage: (messageId: string) => void;
  availableStudents: Array<{ name: string; email: string }>;
}

export const MessagesPage: React.FC<MessagesPageProps> = (props) => {
  return (
    <Suspense fallback={<DashboardSkeleton label="Loading Cohort Bulletins & Discussion Boards..." />}>
      <ErrorBoundary label="Messages Tab">
        <LazyMessagesTab {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

export default MessagesPage;
