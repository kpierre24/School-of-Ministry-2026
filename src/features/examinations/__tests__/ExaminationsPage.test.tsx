import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExaminationsPage } from '../components/ExaminationsPage';

describe('ExaminationsPage — Assessment Portal Operations', () => {
  const defaultProps = {
    students: [],
    allQuizSheets: [],
    rubricScores: {},
    onUpdateRubric: vi.fn(),
    customAssignments: [],
    setCustomAssignments: vi.fn(),
    submissions: [],
    setSubmissions: vi.fn(),
  };

  it('renders page header and navigation sub-tabs', () => {
    render(<ExaminationsPage {...defaultProps} />);

    expect(screen.getByText('Examinations & Academic Assessment')).toBeDefined();
    expect(screen.getByText('Assignments & Coursework')).toBeDefined();
    expect(screen.getByText('Grade Matrix & Rubrics')).toBeDefined();
  });
});
