import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  Music, 
  Video as VideoIcon, 
  Clock, 
  User, 
  Radio, 
  Maximize2, 
  Plus, 
  X, 
  Check, 
  Sparkles,
  Disc,
  ListMusic
} from 'lucide-react';
import { MediaResource } from '../types';
import { UserRole } from '../lib/userAuth';

interface ClassroomMediaPlayerProps {
  mediaResources: MediaResource[];
  courseCode?: string;
  courseTitle?: string;
  userRole?: UserRole;
  onAddMedia?: (newMedia: MediaResource) => void;
  onRemoveMedia?: (mediaId: string) => void;
}

export const DEFAULT_PRESET_MEDIA: MediaResource[] = [
  {
    id: 'm_preset_1',
    title: 'Lecture 1: Kingdom Citizenship & Purpose Mandate (Audio Sermon)',
    speaker: 'Dr. Faculty Director',
    duration: '45:20',
    type: 'audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    description: 'Key lecture on kingdom authority, covenant discipline, and ministerial commitment.',
    dateAdded: '2026-06-02'
  },
  {
    id: 'm_preset_2',
    title: 'Lecture 3: Great Commission Witnessing & Street Evangelism',
    speaker: 'Evangelism Ministry Lead',
    duration: '38:15',
    type: 'audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    description: 'Anointing for personal witnessing, answering tough objections, and disciple follow-up.',
    dateAdded: '2026-06-16'
  },
  {
    id: 'm_preset_3',
    title: 'Video Stream: Apostolic Authority & Church Governance',
    speaker: 'Dr. Faculty Director',
    duration: '52:10',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    description: 'Video recording of Tuesday live session covering Ephesians 2:20 and 5-fold order.',
    dateAdded: '2026-07-24'
  }
];

export const ClassroomMediaPlayer: React.FC<ClassroomMediaPlayerProps> = ({
  mediaResources,
  courseCode,
  courseTitle,
  userRole = 'admin',
  onAddMedia,
  onRemoveMedia
}) => {
  const isStudent = userRole === 'student';
  const playlist = mediaResources.length > 0 ? mediaResources : DEFAULT_PRESET_MEDIA;
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Modal for adding new audio/video resource
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formSpeaker, setFormSpeaker] = useState('Dr. Faculty Director');
  const [formDuration, setFormDuration] = useState('35:00');
  const [formType, setFormType] = useState<'audio' | 'video'>('audio');
  const [formUrl, setFormUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');

  // Auto handle reset audio state when track changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [currentTrackIndex]);

  const togglePlay = () => {
    const el = currentTrack?.type === 'video' ? videoRef.current : audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().then(() => setIsPlaying(true)).catch(e => console.log('Media playback error:', e));
    }
  };

  const handleTimeUpdate = () => {
    const el = currentTrack?.type === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      setCurrentTime(el.currentTime);
      setDuration(el.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    const el = currentTrack?.type === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      el.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) audioRef.current.volume = val;
    if (videoRef.current) videoRef.current.volume = val;
  };

  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    const el = currentTrack?.type === 'video' ? videoRef.current : audioRef.current;
    if (el) el.muted = newMute;
  };

  const changeSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
    if (videoRef.current) videoRef.current.playbackRate = newSpeed;
  };

  const formatSecs = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) return;

    const newRes: MediaResource = {
      id: `media_${Date.now()}`,
      title: formTitle.trim(),
      speaker: formSpeaker.trim() || 'HTEIM Faculty Member',
      duration: formDuration.trim() || '30:00',
      type: formType,
      url: formUrl.trim(),
      description: formDesc.trim() || 'Sermon recording & classroom lecture.',
      dateAdded: new Date().toISOString().split('T')[0]
    };

    if (onAddMedia) {
      onAddMedia(newRes);
    }
    setShowAddModal(false);
    setFormTitle('');
    setFormUrl('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-2xl space-y-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-tight">
                Classroom Sermon & Lecture Audio/Video Player
              </h3>
              {courseCode && (
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-extrabold rounded border border-indigo-500/30">
                  {courseCode}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Listen to recorded sermon MP3s, stream lecture sessions, and download offline audio guides.
            </p>
          </div>
        </div>

        {!isStudent && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Recording</span>
          </button>
        )}
      </div>

      {/* Main Player Display */}
      {currentTrack ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3.5">
          {/* Active Media Container */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Visual Screen / Vinyl Icon */}
            {currentTrack.type === 'video' ? (
              <div className="w-full md:w-56 h-32 bg-black rounded-lg overflow-hidden border border-slate-800 relative flex-shrink-0">
                <video
                  ref={videoRef}
                  src={currentTrack.url}
                  className="w-full h-full object-cover"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            ) : (
              <div className="w-full md:w-44 h-32 bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-950 rounded-2xl border border-indigo-500/40 flex flex-col items-center justify-center p-3 text-center flex-shrink-0 relative overflow-hidden group shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <audio
                  ref={audioRef}
                  src={currentTrack.url}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                />
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Disc className={`w-8 h-8 text-amber-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                  {/* Futuristic Audio Spectrum Bars */}
                  <div className="flex items-end gap-0.5 h-6">
                    <span className={`w-1 bg-amber-400 rounded-full transition-all ${isPlaying ? 'h-5 animate-pulse' : 'h-1.5'}`} />
                    <span className={`w-1 bg-indigo-400 rounded-full transition-all ${isPlaying ? 'h-3 animate-pulse delay-75' : 'h-2'}`} />
                    <span className={`w-1 bg-cyan-400 rounded-full transition-all ${isPlaying ? 'h-6 animate-pulse delay-150' : 'h-1'}`} />
                    <span className={`w-1 bg-emerald-400 rounded-full transition-all ${isPlaying ? 'h-4 animate-pulse' : 'h-2'}`} />
                  </div>
                </div>
                <span className="text-[10px] font-mono font-black text-indigo-300 uppercase tracking-widest bg-indigo-900/60 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  {isPlaying ? 'LIVE STREAM' : 'AUDIO RECORDING'}
                </span>
              </div>
            )}

            {/* Track Info & Progress Bar */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-800 text-amber-300 text-[10px] font-extrabold uppercase rounded border border-slate-700">
                      {currentTrack.type}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                      <User className="w-3 h-3" /> {currentTrack.speaker}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white mt-1 leading-snug">
                    {currentTrack.title}
                  </h4>
                  {currentTrack.description && (
                    <p className="text-xs text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
                      {currentTrack.description}
                    </p>
                  )}
                </div>

                <a
                  href={currentTrack.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer flex-shrink-0"
                  title="Download MP3/MP4 File"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{formatSecs(currentTime)}</span>
                  <span>{currentTrack.duration || formatSecs(duration)}</span>
                </div>
              </div>

              {/* Control Buttons Row */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  <button
                    onClick={changeSpeed}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono font-bold text-xs rounded-lg border border-slate-700 cursor-pointer"
                    title="Change Playback Speed"
                  >
                    {playbackSpeed}x
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="text-slate-400 hover:text-white cursor-pointer">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Playlist Tracks List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
          <span className="flex items-center gap-1.5">
            <ListMusic className="w-3.5 h-3.5 text-amber-400" />
            Classroom Audio & Media Tracklist ({playlist.length})
          </span>
          <span>Click track to play</span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
          {playlist.map((item, idx) => {
            const isSelected = idx === currentTrackIndex;
            return (
              <div
                key={item.id}
                onClick={() => setCurrentTrackIndex(idx)}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-950/70 border-indigo-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.type === 'video' ? <VideoIcon className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate leading-tight">{item.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.speaker} • {item.duration}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isSelected && isPlaying && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold uppercase rounded border border-emerald-500/30 animate-pulse">
                      Playing
                    </span>
                  )}
                  {!isStudent && onRemoveMedia && playlist.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveMedia(item.id);
                      }}
                      className="p-1 hover:bg-rose-950 hover:text-rose-400 rounded text-slate-500 transition-colors"
                      title="Remove media"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Media Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 animate-scaleUp">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" /> Add Classroom Sermon / Audio Recording
              </h4>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Recording Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Sermon: The Apostolic Anointing & Authority"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Speaker / Preacher</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Faculty Director"
                    value={formSpeaker}
                    onChange={(e) => setFormSpeaker(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Media Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as 'audio' | 'video')}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="audio">Audio MP3</option>
                    <option value="video">Video Stream MP4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Audio/Video Stream URL *</label>
                <input
                  required
                  type="url"
                  placeholder="https://example.com/sermon-lecture.mp3"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-500 text-indigo-300"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Brief Description</label>
                <textarea
                  rows={2}
                  placeholder="Notes on the sermon recording or lecture highlights..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg">Add Track</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
