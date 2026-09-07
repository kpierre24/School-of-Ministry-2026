import { AppMessage, MessageCategory, MessagePriority, MessageReply, MessageAttachment } from '../../types';

export type { AppMessage, MessageCategory, MessagePriority, MessageReply, MessageAttachment };

export interface MessageFilterOptions {
  searchQuery: string;
  category: string;
  status: 'all' | 'unread' | 'archived' | 'sent';
  priority?: MessagePriority;
}

export const MESSAGE_PRIORITY_BADGES: Record<MessagePriority, { label: string; color: string }> = {
  urgent: { label: 'Urgent', color: 'rose' },
  important: { label: 'Important', color: 'amber' },
  normal: { label: 'Normal', color: 'slate' },
};
