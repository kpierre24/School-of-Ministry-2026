import { useState, useMemo } from 'react';
import { LibraryResource } from '../../types';
import { libraryService } from './libraryService';

export function useLibraryState(initialResources: LibraryResource[] = []) {
  const [resources, setResources] = useState<LibraryResource[]>(initialResources);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'pdf' | 'docx' | 'audio' | 'video' | 'link'>('all');

  const filteredResources = useMemo(() => {
    return libraryService.filterResources(resources, {
      searchQuery,
      category: selectedCategory,
      mediaType: selectedType,
    });
  }, [resources, searchQuery, selectedCategory, selectedType]);

  const uniqueScriptures = useMemo(() => {
    return libraryService.getUniqueScriptures(resources);
  }, [resources]);

  return {
    resources,
    setResources,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedType,
    setSelectedType,
    filteredResources,
    uniqueScriptures,
  };
}
