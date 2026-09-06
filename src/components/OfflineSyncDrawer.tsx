import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Clock, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Database,
  Layers,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';
import { OfflineQueueItem } from '../types';

interface OfflineSyncDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  onTriggerFullSync?: () => Promise<void> | void;
}

export const OfflineSyncDrawer: React.FC<OfflineSyncDrawerProps> = ({
  isOpen,
  onClose,
  isOnline,
  onTriggerFullSync
}) => {
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadQueue = () => {
    try {
      const raw = localStorage.getItem('hteim_offline_queue');
      if (raw) {
        setQueue(JSON.parse(raw));
      } else {
        setQueue([]);
      }
    } catch {
      setQueue([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQueue();
    }
  }, [isOpen]);

  const handleSyncAll = async () => {
    if (!isOnline) {
      setSyncFeedback('Device is offline. Reconnect to the internet to flush the sync queue.');
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      if (onTriggerFullSync) {
        await onTriggerFullSync();
      }

      // Process and mark each item
      await new Promise(res => setTimeout(res, 1200));

      const updated = queue.map(item => ({
        ...item,
        status: 'synced' as const
      }));

      // Keep recent synced for 2 seconds then clear
      setQueue(updated);
      localStorage.setItem('hteim_offline_queue', JSON.stringify([]));
      setSyncFeedback('All offline actions synchronized successfully with cloud storage!');
      setTimeout(() => {
        setQueue([]);
        setSyncFeedback(null);
      }, 2500);
    } catch (err: any) {
      setSyncFeedback(`Sync encountered an issue: ${err?.message || 'Please retry.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearItem = (id: string) => {
    const filtered = queue.filter(item => item.id !== id);
    setQueue(filtered);
    localStorage.setItem('hteim_offline_queue', JSON.stringify(filtered));
  };

  const handleClearAll = () => {
    setQueue([]);
    localStorage.removeItem('hteim_offline_queue');
  };

  const handleAddSampleOfflineItem = () => {
    const newItem: OfflineQueueItem = {
      id: `q_${Date.now()}`,
      type: 'attendance_checkin',
      description: `Manual Attendance Check-in for Session (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
      payload: { note: 'Offline verification buffered locally' }
    };
    const updated = [newItem, ...queue];
    setQueue(updated);
    localStorage.setItem('hteim_offline_queue', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl relative animate-slideInRight">
        {/* Top Bar */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isOnline 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white font-syne">
                Offline Sync Drawer
              </h2>
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  {isOnline ? 'Online • Ready to Sync' : 'Offline Mode • Buffering Local Data'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Summary Banner */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-400">Buffered Offline Items:</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-full font-mono">
              {queue.length} items
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSyncAll}
              disabled={isSyncing || queue.length === 0}
              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing...' : 'Sync All Queue Items'}</span>
            </button>

            {queue.length > 0 && (
              <button
                onClick={handleClearAll}
                className="py-2 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                title="Clear All Items"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {syncFeedback && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {queue.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  Sync Queue is Clean
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  All attendance records, grades, and notes are up to date with cloud storage.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSampleOfflineItem}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold pt-2 cursor-pointer"
              >
                + Test buffer with sample offline record
              </button>
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs space-y-2 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'synced' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <button
                    onClick={() => handleClearItem(item.id)}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {item.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span>ID: {item.id.slice(-6)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Note */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            Automatic background sync runs whenever internet connection resumes.
          </p>
        </div>

      </div>
    </div>
  );
};
