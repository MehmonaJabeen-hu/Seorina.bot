import React, { useState } from 'react';
import { X, Heart, Sparkles, MapPin, Plus, Trash2, Camera, Settings, BookOpen, Volume2 } from 'lucide-react';
import { Moment, Memory, UserProfile } from '../types';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  moments: Moment[];
  memories: Memory[];
  onAddMemory: (note: string) => void;
  onDeleteMemory: (id: string) => void;
  onSelectMoment: (moment: Moment) => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onClearChat: () => void;
  currentMood: string;
  activityStatus: string;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  moments,
  memories,
  onAddMemory,
  onDeleteMemory,
  onSelectMoment,
  userProfile,
  onUpdateProfile,
  onClearChat,
  currentMood,
  activityStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'moments' | 'memories' | 'settings'>('profile');
  const [newMemoryText, setNewMemoryText] = useState('');

  if (!isOpen) return null;

  const handleAddMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemoryText.trim()) {
      onAddMemory(newMemoryText.trim());
      setNewMemoryText('');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Seol-In-ah's Space
            </h2>
            <span className="text-xs text-stone-500">설인아</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center border-b border-stone-200 dark:border-stone-800 px-4 bg-stone-50 dark:bg-stone-950">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-stone-400'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('moments')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'moments'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-stone-400'
            }`}
          >
            Moments ({moments.length})
          </button>
          <button
            onClick={() => setActiveTab('memories')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'memories'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-stone-400'
            }`}
          >
            Memories ({memories.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-semibold'
                : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-stone-400'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar Hero */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <img
                    src="/src/assets/images/seol_in_ah_avatar_1791636771858.jpg"
                    alt="Seol In-ah"
                    className="w-24 h-24 rounded-full object-cover shadow-md border-2 border-white dark:border-stone-800"
                  />
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
                </div>
                <h3 className="mt-3 text-lg font-bold text-stone-900 dark:text-stone-100">
                  Seol-In-ah (설인아)
                </h3>
                <p className="text-xs text-rose-600 font-medium mt-0.5">@_seorina</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" /> Seoul, South Korea
                  </span>
                  <span>·</span>
                  <span>Active Now</span>
                </div>
              </div>

              {/* Status & Mood Card */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 text-stone-800 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                    Current Mood
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white text-rose-700 shadow-xs">
                    {currentMood || 'Warm & Relaxed 🌸'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-normal">
                  <span className="font-medium text-stone-800">What she is doing: </span>
                  {activityStatus || 'Taking a breather between schedules, checking messages.'}
                </p>
              </div>

              {/* About Seol-In-ah */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  About Her
                </h4>
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  South Korean actress known for <em>Business Proposal</em>, <em>Twinkling Watermelon</em>, and <em>Mr. Queen</em>. In real life, she's an easygoing, bright dog lover who adores skateboarding, acoustic music, iced coffee, and heartwarming late-night conversations with people she cares about.
                </p>
              </div>

              {/* Favorites mini list */}
              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600">
                <div className="flex justify-between py-1">
                  <span className="text-stone-400">Dog Companion</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">Julie (진돗개) 🐾</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-400">Favorite Drink</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">Iced Americano ☕</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-400">Hobbies</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">Skateboarding, Guitar, Walks</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Moments */}
          {activeTab === 'moments' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-500">
                Real snapshots shared by Seol-In-ah. Tap any moment to inspect it or talk about it in chat.
              </p>
              <div className="grid grid-cols-1 gap-4">
                {moments.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onSelectMoment(m)}
                    className="group cursor-pointer rounded-2xl overflow-hidden border border-stone-200 hover:border-rose-300 transition-all shadow-xs hover:shadow-md bg-stone-50 dark:bg-stone-800"
                  >
                    <div className="aspect-4/3 w-full overflow-hidden bg-stone-200">
                      <img
                        src={m.image}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span>{m.location}</span>
                        <span>{m.timeAgo}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mt-0.5">
                        {m.title}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 line-clamp-2">
                        {m.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Memories */}
          {activeTab === 'memories' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  What Seol-In-ah Remembers About You
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  She retains these facts during your conversations so she can ask you about them naturally.
                </p>
              </div>

              {/* Add Custom Memory */}
              <form onSubmit={handleAddMemorySubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="e.g. Loves cats, preparing for a big presentation..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 dark:bg-stone-800 dark:border-stone-700"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-medium transition-colors shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Remember
                </button>
              </form>

              {/* Memory List */}
              <div className="space-y-2">
                {memories.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-400 border border-dashed rounded-2xl">
                    No custom memories yet. As you chat, she will naturally remember things, or you can add them above!
                  </div>
                ) : (
                  memories.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-stone-700 dark:text-stone-300">
                          {mem.note}
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteMemory(mem.id)}
                        className="text-stone-400 hover:text-red-500 transition-colors p-1"
                        title="Delete memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Nickname setting */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Your Nickname
                </label>
                <input
                  type="text"
                  value={userProfile.nickname}
                  onChange={(e) => onUpdateProfile({ nickname: e.target.value })}
                  placeholder="What should Seol-In-ah call you?"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 dark:bg-stone-800 dark:border-stone-700"
                />
                <p className="text-[11px] text-stone-400">
                  She will call you by this nickname in chat messages.
                </p>
              </div>

              {/* Auto Voice Mode */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-rose-500" /> Auto Voice Audio Notes
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Automatically generate realistic spoken audio for Seol-In-ah's replies.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userProfile.autoVoice}
                    onChange={(e) => onUpdateProfile({ autoVoice: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500" />
                </label>
              </div>

              {/* Sound effects */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Messenger Haptic Sounds
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Play gentle pops and chimes when messages arrive.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userProfile.soundEffects}
                    onChange={(e) => onUpdateProfile({ soundEffects: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500" />
                </label>
              </div>

              {/* Danger Zone: Clear History */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={onClearChat}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors text-center"
                >
                  Clear Chat Messages & Start Fresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
