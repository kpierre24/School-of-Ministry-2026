import React, { Suspense } from 'react';
import { LazyMessagesTab } from '../components/tabs';
import { ErrorBoundary } from '../components/ErrorBoundary';

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
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <ErrorBoundary label="Messages Tab">
        <LazyMessagesTab {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

export default MessagesPage;
