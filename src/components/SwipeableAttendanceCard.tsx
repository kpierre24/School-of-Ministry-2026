import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  PenSquare, 
  SlidersHorizontal, 
  Check, 
  RotateCcw
} from 'lucide-react';
import { StudentSummary, ClassDay } from '../types';

interface SwipeableAttendanceCardProps {
  student: StudentSummary;
  effectiveClassDays: ClassDay[];
  activeDayId: string;
  studentPhotos: Record<string, string>;
  studentNotes: Record<string, string>;
  excusedAbsences: Record<string, Record<string, boolean>>;
  isSelected: boolean;
  satisfactoryThreshold: number;
  atRiskThreshold: number;
  studentBadges: any[];
  onToggleAttendance: (studentName: string, dayId: string, status: 'present' | 'absent' | 'excused') => void;
  onSelectStudent: (s: StudentSummary) => void;
  onToggleSelectStudent: (name: string) => void;
  appRole?: string;
}

export const SwipeableAttendanceCard: React.FC<SwipeableAttendanceCardProps> = ({
  student,
  effectiveClassDays,
  activeDayId,
  studentPhotos,
  studentNotes,
  excusedAbsences,
  isSelected,
  satisfactoryThreshold,
  atRiskThreshold,
  studentBadges,
  onToggleAttendance,
  onSelectStudent,
  onToggleSelectStudent,
  appRole
}) => {
  const studentKey = student.name.toLowerCase().trim();
  const cardPhoto = studentPhotos[studentKey] || student.photoUrl;
  const note = studentNotes[studentKey] || student.note;
  const isExcusedMap = excusedAbsences[studentKey] || {};

  // Active day session info for card swipe
  const targetDay = effectiveClassDays.find(d => d.id === activeDayId) || effectiveClassDays[effectiveClassDays.length - 1];
  const targetDayId = targetDay ? targetDay.id : '';
  const currentAttendance = targetDayId ? student.attendanceByDay[targetDayId] : undefined;
  const isPresent = currentAttendance?.present;
  const isExcused = !isPresent && !!isExcusedMap[targetDayId];

  // Touch Swipe State
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeActionText, setSwipeActionText] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isHorizontalSwipe = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (appRole === 'student') return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isHorizontalSwipe.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || appRole === 'student') return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Determine direction on first significant movement
    if (!isHorizontalSwipe.current && Math.abs(deltaX) > 8) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        isHorizontalSwipe.current = true;
      }
    }

    if (isHorizontalSwipe.current) {
      // Limit drag displacement (-120px to +120px)
      const clampedX = Math.max(-120, Math.min(120, deltaX));
      setDragOffset(clampedX);

      if (clampedX > 40) {
        setSwipeActionText('Release to Mark Present ✓');
      } else if (clampedX < -40) {
        setSwipeActionText(isPresent ? 'Release to Mark Excused ⚠' : isExcused ? 'Release to Mark Absent ✗' : 'Release to Mark Excused ⚠');
      } else {
        setSwipeActionText(null);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || appRole === 'student') return;
    setIsDragging(false);

    if (isHorizontalSwipe.current && targetDayId) {
      if (dragOffset > 50) {
        // Swipe Right -> Mark Present
        onToggleAttendance(student.name, targetDayId, 'present');
        if (navigator.vibrate) navigator.vibrate(35);
      } else if (dragOffset < -50) {
        // Swipe Left -> Toggle Excused / Absent
        const nextStatus = isPresent ? 'excused' : isExcused ? 'absent' : 'excused';
        onToggleAttendance(student.name, targetDayId, nextStatus);
        if (navigator.vibrate) navigator.vibrate(25);
      }
    }

    setDragOffset(0);
    setSwipeActionText(null);
    isHorizontalSwipe.current = false;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-xs group">
      {/* Behind Card Background Action Feedback */}
      <div 
        className={`absolute inset-0 flex items-center justify-between px-3 sm:px-5 font-black text-xs text-white transition-colors ${
          dragOffset > 0 
            ? 'bg-emerald-600' 
            : dragOffset < 0 
            ? (isPresent ? 'bg-amber-600' : isExcused ? 'bg-rose-600' : 'bg-amber-600')
            : 'bg-slate-800'
        }`}
      >
        <div className={`flex items-center gap-1.5 sm:gap-2 ${dragOffset > 20 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} transition-all`}>
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-100 animate-pulse shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black">MARK PRESENT</span>
            <span className="text-[8px] sm:text-[9px] opacity-80 font-normal">Swipe Right Complete</span>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 sm:gap-2 ${dragOffset < -20 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} transition-all`}>
          <div className="flex flex-col text-right">
            <span className="text-xs sm:text-sm font-black">{isPresent ? 'MARK EXCUSED' : isExcused ? 'MARK ABSENT' : 'MARK EXCUSED'}</span>
            <span className="text-[8px] sm:text-[9px] opacity-80 font-normal">Swipe Left Complete</span>
          </div>
          {isPresent ? (
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-100 animate-pulse shrink-0" />
          ) : isExcused ? (
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-100 animate-pulse shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-100 animate-pulse shrink-0" />
          )}
        </div>
      </div>

      {/* Main Foreground Card Content */}
      <div
        style={{ transform: `translateX(${dragOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`bg-white dark:bg-slate-900 p-2.5 sm:p-3 relative z-10 space-y-2 sm:space-y-2.5 transition-transform ${
          isDragging ? 'transition-none' : 'duration-300 ease-out'
        } select-none`}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelectStudent(student.name);
              }}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
            />
            
            {cardPhoto ? (
              <img 
                src={cardPhoto} 
                alt={student.name} 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-200 shrink-0" 
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 text-indigo-700 dark:text-indigo-300 font-black text-[11px] sm:text-xs flex items-center justify-center shrink-0">
                {student.name.charAt(0)}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h4 
                  onClick={() => onSelectStudent(student)}
                  className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white truncate hover:text-indigo-600 cursor-pointer"
                >
                  {student.name}
                </h4>
                {note && (
                  <span className="text-indigo-500 bg-indigo-50 dark:bg-indigo-950 p-0.5 rounded text-[9px] shrink-0" title={note}>
                    <PenSquare className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <p className="text-[8px] sm:text-[9px] text-slate-400 font-mono">
                {student.attended}/{effectiveClassDays.length} sessions attended
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {studentBadges.map(b => (
              <span key={b.id} className={`inline-flex items-center p-0.5 rounded text-[8px] sm:text-[9px] ${b.bg}`} title={b.label}>
                {b.icon}
              </span>
            ))}

            <span className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-mono font-extrabold ${
              student.rate >= satisfactoryThreshold 
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' 
                : student.rate >= atRiskThreshold 
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800' 
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
            }`}>
              {Math.round(student.rate)}%
            </span>
          </div>
        </div>

        {/* Quick Swipe Banner Info if Instructor */}
        {appRole !== 'student' && (
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-slate-400 px-1.5 bg-slate-50 dark:bg-slate-800/40 py-1 rounded-lg gap-1 overflow-hidden">
            <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
              <span>👉 Right: Present</span>
            </span>
            <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap shrink-0">
              <span>Left: Excused/Absent 👈</span>
            </span>
          </div>
        )}

        {/* Swipe Feedback Banner when active */}
        {swipeActionText && (
          <div className={`p-1.5 rounded-lg text-center text-[11px] sm:text-xs font-black animate-pulse ${
            dragOffset > 0 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'
          }`}>
            {swipeActionText}
          </div>
        )}

        {/* Horizontal Scrollable Class Days Track */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-bold text-slate-400 px-0.5">
            <span>Sessions ({effectiveClassDays.length})</span>
            <span className="font-mono text-indigo-500 flex items-center gap-0.5">
              <span>Tap to toggle</span>
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar flex gap-1.5 sm:gap-2 pb-1 pt-0.5 touch-pan-x">
            {effectiveClassDays.map(day => {
              const attendance = student.attendanceByDay[day.id];
              const dayPresent = attendance?.present;
              const dayExcused = !dayPresent && !!isExcusedMap[day.id];
              const isCurrentSession = day.id === targetDayId;

              return (
                <div 
                  key={day.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (appRole === 'student') return;
                    onToggleAttendance(
                      student.name, 
                      day.id, 
                      dayPresent ? 'excused' : dayExcused ? 'absent' : 'present'
                    );
                  }}
                  className={`shrink-0 min-w-[90px] sm:min-w-[105px] p-1.5 sm:p-2 rounded-xl border flex flex-col items-center justify-between gap-1 sm:gap-1.5 transition-all text-center select-none ${
                    isCurrentSession ? 'ring-2 ring-indigo-500/80 shadow-xs' : ''
                  } ${
                    dayPresent 
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' 
                      : dayExcused 
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' 
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
                  } ${appRole !== 'student' ? 'cursor-pointer active:scale-95' : ''}`}
                >
                  <div className="flex items-center justify-center gap-1 w-full">
                    <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[75px] sm:max-w-[85px]" title={day.name}>
                      {day.name}
                    </span>
                    {isCurrentSession && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping shrink-0" title="Active Check-in Session" />
                    )}
                  </div>

                  {dayPresent ? (
                    <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] sm:text-[9px] font-black shadow-xs">
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>Present</span>
                    </div>
                  ) : dayExcused ? (
                    <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[8px] sm:text-[9px] font-black shadow-xs">
                      <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>Excused</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-[8px] sm:text-[9px] font-bold border border-rose-300 dark:border-rose-800">
                      <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-500" />
                      <span>Absent</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
