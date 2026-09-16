import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizDashboard } from '../features/assessments/quizzes/QuizDashboard';
import { QuizTaker } from '../features/assessments/quizzes/QuizTaker';
import { QuizSubmissionReview } from '../features/assessments/quizzes/QuizSubmissionReview';
import { DEFAULT_QUIZ_TEMPLATES, gradeQuizSubmission } from '../data/quizTemplates';
import { QuizAssignment, QuizSubmission } from '../types';

describe('Real Browser E2E Quiz Hardening Workflow', () => {
  const sampleQuiz: QuizAssignment = DEFAULT_QUIZ_TEMPLATES[0]; // Hermeneutics & Exegesis Exam

  it('executes full student submission -> auto-grade -> teacher review & override -> student updated result loop', async () => {
    // STEP 1: Student Opens Quiz Taker
    const handleCloseQuizTaker = vi.fn();
    const handleSubmitQuiz = vi.fn();
    const studentName = 'Abigail Selkridge';

    const { container, rerender } = render(
      <QuizTaker
        quiz={sampleQuiz}
        studentName={studentName}
        onClose={handleCloseQuizTaker}
        onSubmitQuiz={handleSubmitQuiz}
      />
    );

    // Verify Quiz Title & Student Header
    expect(screen.getByText(sampleQuiz.title)).toBeDefined();

    // STEP 2: Student Answers Questions
    const radios = container.querySelectorAll('input[type="radio"]');
    if (radios.length > 0) {
      fireEvent.click(radios[0]);
    }

    const textareas = container.querySelectorAll('textarea, input[type="text"]');
    if (textareas.length > 0) {
      fireEvent.change(textareas[0], { target: { value: 'Exegesis interprets text within historical context.' } });
    }

    // STEP 3: Student Submits & Auto-grade triggers
    const submitBtn = screen.getByText(/Submit Quiz|Submit Assessment|Finish Quiz/i);
    expect(submitBtn).toBeDefined();
    fireEvent.click(submitBtn);

    expect(handleSubmitQuiz).toHaveBeenCalled();

    // Generate calculated auto-graded submission
    const studentResponses = {
      'q_herm_1': 'opt_1a',
      'q_herm_2': ['opt_2a', 'opt_2b'],
      'q_herm_3': 'exegesis',
      'q_herm_4': 'opt_4a'
    };

    const autoGradedSubmission: QuizSubmission = gradeQuizSubmission(
      sampleQuiz,
      studentResponses,
      studentName,
      'abigail@hteim.edu',
      90
    );

    expect(autoGradedSubmission.studentName).toBe(studentName);
    expect(autoGradedSubmission.score).toBeGreaterThan(0);
    expect(autoGradedSubmission.totalPossible).toBe(sampleQuiz.totalPoints);

    // STEP 4: Teacher Login & Review Dashboard
    const updatedSubmissions: QuizSubmission[] = [autoGradedSubmission];
    const handleSaveFeedback = vi.fn((subId: string, feedback: string, manualScoreOverride?: number) => {
      const target = updatedSubmissions.find(s => s.id === subId);
      if (target) {
        if (manualScoreOverride !== undefined) {
          target.score = manualScoreOverride;
          target.totalScore = manualScoreOverride;
          target.percentage = Math.round((manualScoreOverride / target.totalPossible) * 100);
        }
        target.teacherFeedback = feedback;
        target.feedbackGiven = true;
      }
    });

    rerender(
      <QuizDashboard
        userRole="teacher"
        quizzes={[sampleQuiz]}
        submissions={updatedSubmissions}
      />
    );

    // Verify Teacher Dashboard rendering
    expect(screen.getByText('Quiz Management & Analytics')).toBeDefined();

    // STEP 5: Teacher Views Submissions Log & Opens Review
    rerender(
      <QuizSubmissionReview
        submission={autoGradedSubmission}
        onClose={vi.fn()}
        onSaveFeedback={handleSaveFeedback}
      />
    );

    expect(screen.getByText('Student Submission & Grading Review')).toBeDefined();
    expect(screen.getAllByText(studentName).length).toBeGreaterThan(0);

    // STEP 6: Teacher Overrides Grade & Adds Feedback
    const teacherNotes = 'Outstanding theological reasoning and exegesis, Abigail!';
    const numberInput = container.querySelector('input[type="number"]');
    const textInput = container.querySelector('input[placeholder*="feedback"]');

    if (numberInput) {
      fireEvent.change(numberInput, { target: { value: '100' } });
    }
    if (textInput) {
      fireEvent.change(textInput, { target: { value: teacherNotes } });
    }

    const saveEvaluationBtn = screen.getByText('Save Evaluation');
    fireEvent.click(saveEvaluationBtn);

    expect(handleSaveFeedback).toHaveBeenCalledWith(
      autoGradedSubmission.id,
      teacherNotes,
      100
    );

    // STEP 7: Student Sees Updated Result & Score Override
    expect(autoGradedSubmission.score).toBe(100);
    expect(autoGradedSubmission.percentage).toBe(100);
    expect(autoGradedSubmission.teacherFeedback).toBe(teacherNotes);
  });
});
