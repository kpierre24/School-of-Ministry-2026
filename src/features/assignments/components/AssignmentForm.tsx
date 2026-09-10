import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Award, BookOpen, Paperclip, Save, X, AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { CustomAssignment } from '../../../types';
import { AssignmentFormData } from '../types';

interface AssignmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: AssignmentFormData) => void;
  assignment?: CustomAssignment | null;
  courses?: { code: string; title: string }[];
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  assignment,
  courses = [
    { code: 'M101', title: 'Old Testament Survey' },
    { code: 'M102', title: 'New Testament Survey' },
    { code: 'M103', title: 'Systematic Theology' },
    { code: 'M104', title: 'Homiletics & Preaching' },
    { code: 'M105', title: 'Leadership Dynamics' },
    { code: 'M106', title: 'Pastoral Care & Counseling' },
  ],
}) => {
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('M101');
  const [moduleTrack, setModuleTrack] = useState('Core Curriculum');
  const [cohortId, setCohortId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxPoints, setMaxPoints] = useState(100);
  const [type, setType] = useState<'document' | 'quiz'>('document');
  const [description, setDescription] = useState('');
  const [teacherAttachmentUrl, setTeacherAttachmentUrl] = useState('');
  const [teacherAttachmentName, setTeacherAttachmentName] = useState('');
  const [published, setPublished] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title || '');
      setCourseCode(assignment.courseCode || 'M101');
      setModuleTrack(assignment.moduleTrack || 'Core Curriculum');
      setCohortId(assignment.cohortId || '');
      setDueDate(assignment.dueDate || '');
      setMaxPoints(assignment.maxPoints || 100);
      setType(assignment.type || 'document');
      setDescription(assignment.description || '');
      setTeacherAttachmentUrl(assignment.teacherAttachmentUrl || '');
      setTeacherAttachmentName(assignment.teacherAttachmentName || '');
      setPublished(assignment.published !== false);
    } else {
      // Default state for new assignment
      setTitle('');
      setCourseCode('M101');
      setModuleTrack('Core Curriculum');
      setCohortId('');
      const defaultDue = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      setDueDate(defaultDue);
      setMaxPoints(100);
      setType('document');
      setDescription('');
      setTeacherAttachmentUrl('');
      setTeacherAttachmentName('');
      setPublished(true);
    }
    setErrors({});
  }, [assignment, isOpen]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!dueDate) errs.dueDate = 'Due date is required';
    if (maxPoints <= 0) errs.maxPoints = 'Max points must be greater than 0';
    if (!description.trim()) errs.description = 'Guidelines / description are required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      id: assignment?.id,
      title: title.trim(),
      courseCode,
      moduleTrack,
      cohortId: cohortId || undefined,
      dueDate,
      maxPoints: Number(maxPoints),
      type,
      description: description.trim(),
      teacherAttachmentUrl: teacherAttachmentUrl || undefined,
      teacherAttachmentName: teacherAttachmentName || undefined,
      published,
      isDraft: !published,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>{assignment ? 'Edit Assignment' : 'Create New Assignment'}</span>
        </div>
      }
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
            Assignment Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Module 1 Hermeneutics Exegesis Paper"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Course Code & Module Track */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Course / Module
            </label>
            <select
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {courses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'document' | 'quiz')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="document">Written / Document Essay</option>
              <option value="quiz">Interactive Quiz</option>
            </select>
          </div>
        </div>

        {/* Due Date & Max Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Max Points Possible <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Award className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                max="1000"
                value={maxPoints}
                onChange={(e) => setMaxPoints(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            {errors.maxPoints && <p className="text-xs text-red-500 mt-1">{errors.maxPoints}</p>}
          </div>
        </div>

        {/* Guidelines / Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
            Instructions & Guidelines <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed submission guidelines, rubric requirements, formatting rules..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
        </div>

        {/* Teacher Resource Attachment */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase">
              Teacher Reference Material Attachment (Optional)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Attachment Display Title (e.g., Sample Essay Template.pdf)"
              value={teacherAttachmentName}
              onChange={(e) => setTeacherAttachmentName(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none"
            />
            <input
              type="url"
              placeholder="Document URL / Link"
              value={teacherAttachmentUrl}
              onChange={(e) => setTeacherAttachmentUrl(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none"
            />
          </div>
        </div>

        {/* Published Toggle */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Publish immediately (visible to students)
            </span>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{assignment ? 'Save Changes' : 'Create Assignment'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
