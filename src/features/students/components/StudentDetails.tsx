import React from 'react';
import { User, Mail, Phone, GraduationCap, Award, Calendar, FileText, Trash2, Edit3 } from 'lucide-react';
import { Modal, Button, Badge, Card } from '../../../components/ui';
import { StudentSummary, ACADEMIC_LEVELS, ClassDay } from '../../../types';
import { useStudent } from '../hooks/useStudent';

export interface StudentDetailsProps {
  student: StudentSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (student: StudentSummary) => void;
  onDelete?: (studentId: string) => void;
  onViewTranscript?: (student: StudentSummary) => void;
  classDays?: ClassDay[];
}

export function StudentDetails({
  student,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onViewTranscript,
  classDays = [],
}: StudentDetailsProps) {
  const { isAtRisk, isHonorRoll, attendanceDetails } = useStudent({
    student,
    classDays,
  });

  if (!student) return null;

  const levelInfo = ACADEMIC_LEVELS.find((l) => l.id === student.levelId) || ACADEMIC_LEVELS[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Academic Profile" size="lg">
      <div className="space-y-5">
        {/* Profile Card Banner */}
        <div className="flex items-start justify-between rounded-2xl bg-[var(--md-surface-container-high)] p-4 border border-[var(--md-outline-variant)]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] font-bold text-xl">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt={student.name} className="h-full w-full rounded-2xl object-cover" />
              ) : (
                student.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--md-on-surface)]">{student.name}</h3>
              <p className="text-xs text-[var(--md-on-surface-variant)]">{student.studentNumber || 'Student ID: Unassigned'}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${levelInfo.color}`}>
                  <GraduationCap className="h-3 w-3" />
                  {levelInfo.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <Badge variant={isAtRisk ? 'danger' : 'success'}>
              {isAtRisk ? 'At Risk (<75%)' : 'Satisfactory Standing'}
            </Badge>
            {isHonorRoll && (
              <Badge variant="info">
                <Award className="h-3 w-3 mr-1 text-amber-500" />
                Honor Roll Scholar
              </Badge>
            )}
          </div>
        </div>

        {/* Contact & Registration Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] p-3">
            <div className="font-bold text-[var(--md-on-surface-variant)] mb-1">Email Address</div>
            <div className="flex items-center gap-1.5 text-[var(--md-on-surface)] font-medium">
              <Mail className="h-3.5 w-3.5 text-[var(--md-primary)]" />
              <span>{student.email || 'No email provided'}</span>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] p-3">
            <div className="font-bold text-[var(--md-on-surface-variant)] mb-1">Phone Contact</div>
            <div className="flex items-center gap-1.5 text-[var(--md-on-surface)] font-medium">
              <Phone className="h-3.5 w-3.5 text-[var(--md-primary)]" />
              <span>{student.phone || 'No phone number'}</span>
            </div>
          </div>
        </div>

        {/* Attendance & Performance Grid */}
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[var(--md-surface-container-high)] p-3.5 border border-[var(--md-outline-variant)] text-center">
          <div>
            <div className="text-[10px] font-bold text-[var(--md-on-surface-variant)]">Attendance Rate</div>
            <div className={`text-base font-extrabold ${isAtRisk ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {student.rate}%
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-[var(--md-on-surface-variant)] font-bold">Attended / Total</div>
            <div className="text-base font-extrabold text-[var(--md-on-surface)]">
              {student.attended} / {student.totalDays}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-[var(--md-on-surface-variant)]">Average Score</div>
            <div className="text-base font-extrabold text-[var(--md-on-surface)]">
              {student.avgScore !== null ? `${student.avgScore}%` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Notes / Remarks */}
        {student.note && (
          <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] p-3 text-xs">
            <div className="font-bold text-[var(--md-on-surface-variant)] mb-1">Faculty Remarks</div>
            <p className="text-[var(--md-on-surface)] leading-relaxed">{student.note}</p>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-[var(--md-outline-variant)] pt-3">
          {onDelete ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (window.confirm(`Are you sure you want to remove student record for ${student.name}?`)) {
                  onDelete(student.id || student.name);
                  onClose();
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {onViewTranscript && (
              <Button variant="secondary" size="sm" onClick={() => onViewTranscript(student)}>
                <FileText className="h-3.5 w-3.5 mr-1" /> Academic Transcript
              </Button>
            )}

            {onEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onEdit(student);
                  onClose();
                }}
              >
                <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
