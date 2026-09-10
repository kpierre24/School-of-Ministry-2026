import React, { useState, useEffect } from 'react';
import { User, Mail, GraduationCap } from 'lucide-react';
import { Modal, Button } from '../../../components/ui';
import { StudentSummary, ACADEMIC_LEVELS } from '../../../types';
import { StudentFormData } from '../types';

export interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: StudentFormData) => void;
  initialData?: StudentSummary | null;
  isLoading?: boolean;
}

export function StudentForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: StudentFormProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    studentNumber: '',
    email: '',
    phone: '',
    levelId: 'level_1',
    enrolledModule: '',
    note: '',
    cohortId: 'HTEIM-2026',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        name: initialData.name || '',
        studentNumber: initialData.studentNumber || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        levelId: initialData.levelId || 'level_1',
        enrolledModule: initialData.enrolledModule || '',
        note: initialData.note || '',
        cohortId: initialData.cohortId || 'HTEIM-2026',
      });
    } else {
      setFormData({
        name: '',
        studentNumber: '',
        email: '',
        phone: '',
        levelId: 'level_1',
        enrolledModule: '',
        note: '',
        cohortId: 'HTEIM-2026',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Student Record' : 'Enroll New Ministry Student'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-[var(--md-on-surface)] mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--md-on-surface-variant)]" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Brother John Doe"
              className="w-full rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] py-2 pl-9 pr-3 text-xs font-medium text-[var(--md-on-surface)] transition focus:border-[var(--md-primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* Student Number & Email Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[var(--md-on-surface)] mb-1">
              Student ID Number
            </label>
            <input
              type="text"
              value={formData.studentNumber}
              onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
              placeholder="HTEIM-2026-001"
              className="w-full rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] py-2 px-3 text-xs font-medium text-[var(--md-on-surface)] transition focus:border-[var(--md-primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--md-on-surface)] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--md-on-surface-variant)]" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@hteim.org"
                className="w-full rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] py-2 pl-9 pr-3 text-xs font-medium text-[var(--md-on-surface)] transition focus:border-[var(--md-primary)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Academic Level & Enrolled Module */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[var(--md-on-surface)] mb-1">
              Academic Level
            </label>
            <select
              value={formData.levelId}
              onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
              className="w-full rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] py-2 px-3 text-xs font-semibold text-[var(--md-on-surface)] transition focus:border-[var(--md-primary)] focus:outline-none"
            >
              {ACADEMIC_LEVELS.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--md-on-surface)] mb-1">
              Enrolled Module
            </label>
            <input
              type="text"
              value={formData.enrolledModule}
              onChange={(e) => setFormData({ ...formData, enrolledModule: e.target.value })}
              placeholder="Module 1: Foundations"
              className="w-full rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] py-2 px-3 text-xs font-medium text-[var(--md-on-surface)] transition focus:border-[var(--md-primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* Academic Notes */}
        <div>
          <label className="block text-xs font-bold text-[var(--md-on-surface)] mb-1">
            Faculty Notes & Remarks
          </label>
          <textarea
            rows={3}
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="Academic standings, special accommodations, or attendance records..."
            className="w-full rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] p-3 text-xs font-medium text-[var(--md-on-surface)] transition focus:border-[var(--md-primary)] focus:outline-none resize-none"
          />
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--md-outline-variant)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {initialData ? 'Save Changes' : 'Enroll Student'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
