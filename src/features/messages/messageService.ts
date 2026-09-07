import { AppMessage } from '../../types';
import { MessageFilterOptions } from './messageSchemas';

export class MessageService {
  /**
   * Filter messages based on status, category, and search query
   */
  public filterMessages(
    messages: AppMessage[],
    options: MessageFilterOptions,
    currentUserName?: string
  ): AppMessage[] {
    const q = options.searchQuery.toLowerCase().trim();

    return messages.filter(msg => {
      const matchSearch = !q ||
        msg.subject.toLowerCase().includes(q) ||
        msg.content.toLowerCase().includes(q) ||
        msg.senderName.toLowerCase().includes(q) ||
        msg.recipientName.toLowerCase().includes(q);

      const matchCategory = options.category === 'all' || msg.category === options.category;

      let matchStatus = true;
      if (options.status === 'unread') {
        matchStatus = !msg.isReadByRecipient && msg.recipientName.toLowerCase().trim() === (currentUserName || '').toLowerCase().trim();
      } else if (options.status === 'archived') {
        matchStatus = msg.status === 'archived';
      } else if (options.status === 'sent') {
        matchStatus = msg.senderName.toLowerCase().trim() === (currentUserName || '').toLowerCase().trim();
      }

      return matchSearch && matchCategory && matchStatus;
    });
  }

  /**
   * Calculate unread messages count for recipient
   */
  public getUnreadCount(messages: AppMessage[], currentUserName?: string): number {
    if (!currentUserName) return 0;
    const normUser = currentUserName.toLowerCase().trim();
    return messages.filter(
      m => m.recipientName.toLowerCase().trim() === normUser && !m.isReadByRecipient && m.status !== 'archived'
    ).length;
  }
}

export const messageService = new MessageService();
