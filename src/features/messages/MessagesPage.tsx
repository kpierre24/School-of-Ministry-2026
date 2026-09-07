import React from 'react';
import { MessagesTab as MessagesLegacyView, MessagesTabProps } from '../../components/MessagesTab';

export interface MessagesPageProps extends Partial<MessagesTabProps> {
  messages?: MessagesTabProps['messages'];
  onSendMessage?: MessagesTabProps['onSendMessage'];
  onReplyMessage?: MessagesTabProps['onReplyMessage'];
  onUpdateStatus?: MessagesTabProps['onUpdateStatus'];
}

export const MessagesPage: React.FC<MessagesPageProps> = (props) => {
  return (
    <MessagesLegacyView
      messages={props.messages || []}
      onSendMessage={props.onSendMessage || (() => {})}
      onReplyMessage={props.onReplyMessage || (() => {})}
      onUpdateStatus={props.onUpdateStatus || (() => {})}
      {...props}
    />
  );
};

export default MessagesPage;
