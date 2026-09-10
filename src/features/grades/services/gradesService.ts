import {
  GradeRecord,
  CanonicalGradeStage,
  GradeClassification,
  GradeFilterOptions,
  GradeStats,
  GradeInputData,
  GradeTransitionData,
  GradeOverrideData,
} from '../types';

/**
 * Normalizes any lifecycle status string to canonical uppercase stage.
 */
export function normalizeGradeStage(status: string = ''): CanonicalGradeStage {
  const s = status.toUpperCase().trim();
  if (s.includes('LOCK')) return 'LOCKED';
  if (s.includes('RELEASE')) return 'RELEASED';
  if (s.includes('MODERAT')) return 'MODERATION';
  if (s.includes('GRAD')) return 'GRADED';
  return 'SUBMITTED';
}

/**
 * School of Ministry Grading Scale Standards:
 * Honor Roll / High Distinction: >= 85%
 * Satisfactory: >= 75%
 * At-Risk: < 75%
 */
export function calculateGradeCategory(percentage: number): GradeClassification {
  if (percentage >= 85) return 'Honor Roll';
  if (percentage >= 75) return 'Satisfactory';
  return 'At-Risk';
}

/**
 * Returns available next lifecycle transition targets from current stage.
 * Lifecycle flow: SUBMITTED -> GRADED -> MODERATION -> RELEASED -> LOCKED
 */
export function getNextLifecycleStages(currentStatus: string): CanonicalGradeStage[] {
  const stage = normalizeGradeStage(currentStatus);
  switch (stage) {
    case 'SUBMITTED':
      return ['GRADED'];
    case 'GRADED':
      return ['MODERATION', 'RELEASED'];
    case 'MODERATION':
      return ['RELEASED', 'GRADED'];
    case 'RELEASED':
      return ['LOCKED', 'MODERATION'];
    case 'LOCKED':
      return []; // Locked requires administrative override route
    default:
      return ['GRADED'];
  }
}

/**
 * Calculate aggregate grade statistics across a dataset of grade records.
 */
export function calculateGradeStats(grades: GradeRecord[] = []): GradeStats {
  const totalGrades = grades.length;
  let scorePercentageSum = 0;
  let scoredCount = 0;

  let submittedCount = 0;
  let gradedCount = 0;
  let moderationCount = 0;
  let releasedCount = 0;
  let lockedCount = 0;

  let honorRollCount = 0;
  let satisfactoryCount = 0;
  let atRiskCount = 0;

  grades.forEach((g) => {
    const stage = normalizeGradeStage(g.status);
    switch (stage) {
      case 'SUBMITTED':
        submittedCount++;
        break;
      case 'GRADED':
        gradedCount++;
        break;
      case 'MODERATION':
        moderationCount++;
        break;
      case 'RELEASED':
        releasedCount++;
        break;
      case 'LOCKED':
        lockedCount++;
        break;
    }

    const pct = typeof g.percentage === 'number'
      ? g.percentage
      : g.maxPoints > 0
      ? Math.round((g.score / g.maxPoints) * 100)
      : 0;

    scorePercentageSum += pct;
    scoredCount++;

    const cat = calculateGradeCategory(pct);
    if (cat === 'Honor Roll') honorRollCount++;
    else if (cat === 'Satisfactory') satisfactoryCount++;
    else atRiskCount++;
  });

  const averagePercentage = scoredCount > 0 ? Math.round(scorePercentageSum / scoredCount) : 0;

  return {
    totalGrades,
    averagePercentage,
    submittedCount,
    gradedCount,
    moderationCount,
    releasedCount,
    lockedCount,
    honorRollCount,
    satisfactoryCount,
    atRiskCount,
  };
}

/**
 * Filters grade records by search query, course, status, student ID, etc.
 */
export function filterGrades(
  grades: GradeRecord[] = [],
  filters: GradeFilterOptions = {}
): GradeRecord[] {
  const { search = '', courseCode = '', status = '', studentId, studentName } = filters;

  return grades.filter((g) => {
    // Student ID check
    if (studentId && g.studentId && g.studentId !== studentId) return false;

    // Student Name check
    if (studentName) {
      const target = studentName.toLowerCase().trim();
      const name = g.studentName.toLowerCase().trim();
      if (!name.includes(target)) return false;
    }

    // Course Code check
    if (courseCode && courseCode !== 'all') {
      if (g.courseCode.toUpperCase() !== courseCode.toUpperCase()) return false;
    }

    // Status check
    if (status && status !== 'all') {
      const canonicalTarget = normalizeGradeStage(status);
      const canonicalCurrent = normalizeGradeStage(g.status);
      if (canonicalCurrent !== canonicalTarget) return false;
    }

    // Search query check
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = g.studentName.toLowerCase().includes(q);
      const matchAssignment = g.assignmentTitle.toLowerCase().includes(q);
      const matchCourse = g.courseCode.toLowerCase().includes(q);
      const matchFeedback = (g.feedback || '').toLowerCase().includes(q);
      if (!matchName && !matchAssignment && !matchCourse && !matchFeedback) return false;
    }

    return true;
  });
}

// ==========================================
// API Interaction Services with Error Handling
// ==========================================

export async function fetchGradesApi(filters: GradeFilterOptions = {}): Promise<GradeRecord[]> {
  try {
    const params = new URLSearchParams();
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.studentName) params.append('studentName', filters.studentName);

    const res = await fetch(`/api/grades?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch grades: ${res.statusText}`);
    }
    const data = await res.json();
    return (data.grades || []).map((item: any) => ({
      id: item.id || item.submissionId || `grade_${Math.random()}`,
      submissionId: item.submissionId || item.id,
      studentId: item.studentId,
      studentName: item.studentName || item.student?.name || 'Unknown Student',
      studentNumber: item.studentNumber || item.student?.studentNumber,
      assignmentId: item.assignmentId || 'asg_gen',
      assignmentTitle: item.assignmentTitle || item.assignment?.title || 'Coursework Assignment',
      courseCode: item.courseCode || item.assignment?.courseCode || 'GENERAL',
      score: item.score ?? 0,
      maxPoints: item.maxPoints || item.assignment?.maxPoints || 100,
      percentage: item.maxPoints > 0 ? Math.round(((item.score || 0) / (item.maxPoints || 100)) * 100) : 0,
      feedback: item.teacherFeedback || item.feedback,
      status: normalizeGradeStage(item.status),
      submittedAt: item.submittedAt,
      updatedAt: item.updatedAt,
    }));
  } catch (err) {
    console.warn('API grades fetch failed, using memory state:', err);
    return [];
  }
}

export async function recordGradeApi(data: GradeInputData): Promise<any> {
  const res = await fetch('/api/grades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to record grade: HTTP ${res.status}`);
  }

  return res.json();
}

export async function transitionGradeLifecycleApi(data: GradeTransitionData): Promise<any> {
  const res = await fetch('/api/grades/transition', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to transition grade stage: HTTP ${res.status}`);
  }

  return res.json();
}

export async function overrideGradeApi(data: GradeOverrideData): Promise<any> {
  const res = await fetch('/api/grades/override', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Failed to perform administrative override: HTTP ${res.status}`);
  }

  return res.json();
}
