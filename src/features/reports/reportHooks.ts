import { useState } from 'react';
import { ReportType } from './reportSchemas';

export function useReportsState(initialType: ReportType = 'enrollment') {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  return {
    selectedReportType,
    setSelectedReportType,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
  };
}
