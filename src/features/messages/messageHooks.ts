import { useState, useMemo } from 'react';
import { AppMessage } from '../../types';
import { messageService } from './messageService';

export function useMessages(initialMessages: AppMessage[] = [], currentUserName?: string) {
  const [messages, setMessages] = useState<AppMessage[]>(initialMessages);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unread' | 'archived' | 'sent'>('all');

  const filteredMessages = useMemo(() => {
    return messageService.filterMessages(messages, {
      searchQuery,
      category: selectedCategory,
      status: selectedStatus,
    }, currentUserName);
  }, [messages, searchQuery, selectedCategory, selectedStatus, currentUserName]);

  const unreadCount = useMemo(() => {
    return messageService.getUnreadCount(messages, currentUserName);
  }, [messages, currentUserName]);

  return {
    messages,
    setMessages,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    filteredMessages,
    unreadCount,
  };
}
