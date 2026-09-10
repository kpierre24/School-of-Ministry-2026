import { useState, useMemo, useCallback } from 'react';
import { AssignmentSubmission } from '../../../types';
import {
  SubmissionFormData,
  GradeFormData,
  SubmissionStatusFilter,
} from '../types';
import {
  filterSubmissions,
  createSubmissionObject,
  gradeSubmissionObject,
  getStudentSubmission,
} from '../services/assignmentsService';

interface UseSubmissionsProps {
  initialSubmissions?: AssignmentSubmission[];
  assignmentId?: string;
  studentName?: string;
  onSubmissionsChange?: (submissions: AssignmentSubmission[]) => void;
}

export function useSubmissions({
  initialSubmissions = [],
  assignmentId,
  studentName,
  onSubmissionsChange,
}: UseSubmissionsProps = {}) {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(initialSubmissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatusFilter>('all');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const handleSetSubmissions = useCallback(
    (newSubmissions: AssignmentSubmission[] | ((prev: AssignmentSubmission[]) => AssignmentSubmission[])) => {
      setSubmissions((prev) => {
        const updated = typeof newSubmissions === 'function' ? newSubmissions(prev) : newSubmissions;
        if (onSubmissionsChange) {
          onSubmissionsChange(updated);
        }
        return updated;
      });
    },
    [onSubmissionsChange]
  );

  const filteredSubmissions = useMemo(() => {
    return filterSubmissions(submissions, {
      assignmentId,
      studentName,
      search: searchQuery,
      statusFilter,
    });
  }, [submissions, assignmentId, studentName, searchQuery, statusFilter]);

  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return null;
    return submissions.find((s) => s.id === selectedSubmissionId) || null;
  }, [submissions, selectedSubmissionId]);

  const submitAssignment = useCallback(
    (formData: SubmissionFormData): AssignmentSubmission => {
      const existing = getStudentSubmission(formData.assignmentId, formData.studentName, submissions);

      let updatedSubmission: AssignmentSubmission;
      if (existing) {
        updatedSubmission = {
          ...existing,
          submittedAt: new Date().toISOString(),
          studentFileUrl: formData.fileUrl || existing.studentFileUrl,
          studentFileName: formData.fileName || existing.studentFileName,
          studentFileType: formData.fileType || existing.studentFileType,
          studentFiles: formData.fileUrl
            ? [{ name: formData.fileName || 'Submission Document', url: formData.fileUrl, type: formData.fileType }]
            : existing.studentFiles,
          studentNotes: formData.studentNotes ?? existing.studentNotes,
          studentTypedResponse: formData.studentTypedResponse ?? existing.studentTypedResponse,
          status: 'Submitted',
          updatedAt: new Date().toISOString(),
        };

        handleSetSubmissions((prev) => prev.map((s) => (s.id === existing.id ? updatedSubmission : s)));
      } else {
        updatedSubmission = createSubmissionObject(formData);
        handleSetSubmissions((prev) => [updatedSubmission, ...prev]);
      }

      return updatedSubmission;
    },
    [submissions, handleSetSubmissions]
  );

  const gradeSubmission = useCallback(
    (gradeData: GradeFormData): AssignmentSubmission | null => {
      const target = submissions.find((s) => s.id === gradeData.submissionId);
      if (!target) return null;

      const graded = gradeSubmissionObject(target, gradeData);
      handleSetSubmissions((prev) => prev.map((s) => (s.id === target.id ? graded : s)));
      return graded;
    },
    [submissions, handleSetSubmissions]
  );

  const deleteSubmission = useCallback(
    (submissionId: string) => {
      handleSetSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
      if (selectedSubmissionId === submissionId) {
        setSelectedSubmissionId(null);
      }
    },
    [handleSetSubmissions, selectedSubmissionId]
  );

  const getSubmissionForStudent = useCallback(
    (asgId: string, stName: string) => {
      return getStudentSubmission(asgId, stName, submissions);
    },
    [submissions]
  );

  return {
    submissions,
    setSubmissions: handleSetSubmissions,
    filteredSubmissions,
    selectedSubmission,
    selectedSubmissionId,
    setSelectedSubmissionId,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    submitAssignment,
    gradeSubmission,
    deleteSubmission,
    getSubmissionForStudent,
  };
}
