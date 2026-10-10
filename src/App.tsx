import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Sparkles,
  Volume2,
  VolumeX,
  Phone,
  Info,
  ChevronDown,
  Trash2,
  X,
  Compass,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { Message, UserProfile, Memory, Moment } from './types';
import { INITIAL_MOMENTS } from './data/moments';
import { soundEffects, requestVoiceNote } from './utils/audio';
import { ChatBubble } from './components/ChatBubble';
import { ProfileDrawer } from './components/ProfileDrawer';
import { PhotoModal } from './components/PhotoModal';

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    sender: 'bot',
    text: 'Annyeong~! 👋 Just sat down with an iced Americano after walking Julie in the park. How is your day going?',
    timestamp: Date.now() - 1000 * 60 * 5,
  },
  {
    id: 'msg-2',
    sender: 'bot',
    text: "Don't be shy, tell me what you've been up to today! Anything fun or stressful happen? 🌿",
    timestamp: Date.now() - 1000 * 60 * 4,
  },
];

export default function App() {
  // Local storage state
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('seol_in_ah_messages');
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('seol_in_ah_profile');
      return saved ? JSON.parse(saved) : { nickname: 'Friend', autoVoice: false, soundEffects: true };
    } catch {
      return { nickname: 'Friend', autoVoice: false, soundEffects: true };
    }
  });

  const [memories, setMemories] = useState<Memory[]>(() => {
    try {
      const saved = localStorage.getItem('seol_in_ah_memories');
      return saved ? JSON.parse(saved) : [
        { id: 'mem-1', note: 'Met Seol-In-ah on her companion messenger', createdAt: Date.now() },
        { id: 'mem-2', note: 'Enjoys warm and genuine conversations', createdAt: Date.now() },
      ];
    } catch {
      return [];
    }
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentMood, setCurrentMood] = useState('Relaxed 🌿');
  const [activityStatus, setActivityStatus] = useState('Taking a breather at a quiet Hannam cafe');
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'How was your day?',
    'Tell me about Julie 🐾',
    'Send me a voice note! 🎙️',
    'Recommend a chill song 🎵',
  ]);

  // Modals & Drawers
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [inspectingMoment, setInspectingMoment] = useState<Moment | null>(null);
  const [isCallingModal, setIsCallingModal] = useState(false);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');

  // Speech Recognition (Mic)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('seol_in_ah_messages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('seol_in_ah_profile', JSON.stringify(userProfile));
    } catch {}
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('seol_in_ah_memories', JSON.stringify(memories));
    } catch {}
  }, [memories]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recog.onerror = () => {
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
        setIsListening(false);
      }
    }
  };

  // Send message handler
  // Send message handler with instant streaming & non-blocking voice synthesis
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    if (userProfile.soundEffects) {
      soundEffects.playPop();
    }

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    const wantsVoice = userProfile.autoVoice || /voice note|voice message|send voice|speak|say it/i.test(text);
    const botMsgId = `bot-${Date.now()}`;

    // Helper for background non-blocking voice synthesis
    const triggerBackgroundVoice = (messageId: string, replyText: string) => {
      // Mark message as generating voice
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isGeneratingVoice: true } : m))
      );

      requestVoiceNote(replyText)
        .then((audioBase64) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, audioBase64, isVoiceNote: true, isGeneratingVoice: false }
                : m
            )
          );
        })
        .catch((voiceErr) => {
          console.warn('Voice synthesis failed in background:', voiceErr);
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, isGeneratingVoice: false } : m))
          );
        });
    };

    try {
      // Attempt 1: Fast real-time SSE streaming for sub-second first-token latency
      const streamRes = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          userProfile,
          memories,
        }),
      });

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamedText = '';
        let messageAdded = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            try {
              const data = JSON.parse(trimmed.replace(/^data:\s*/, ''));

              if (data.type === 'chunk' && data.text) {
                streamedText += data.text;

                if (!messageAdded) {
                  messageAdded = true;
                  setIsTyping(false);
                  if (userProfile.soundEffects) {
                    soundEffects.playReceive();
                  }
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: botMsgId,
                      sender: 'bot',
                      text: streamedText,
                      timestamp: Date.now(),
                      isStreaming: true,
                    },
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsgId ? { ...m, text: streamedText } : m
                    )
                  );
                }
              } else if (data.type === 'done') {
                const finalReply = data.fullText || streamedText;
                if (data.mood) setCurrentMood(data.mood);
                if (data.activityStatus) setActivityStatus(data.activityStatus);
                if (data.suggestedPrompts && Array.isArray(data.suggestedPrompts)) {
                  setSuggestedPrompts(data.suggestedPrompts);
                }

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? { ...m, text: finalReply, isStreaming: false }
                      : m
                  )
                );

                if (wantsVoice && finalReply) {
                  triggerBackgroundVoice(botMsgId, finalReply);
                }
                return;
              }
            } catch (parseErr) {
              console.warn('Error parsing SSE event:', parseErr);
            }
          }
        }

        if (streamedText) {
          setIsTyping(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId ? { ...m, isStreaming: false } : m
            )
          );
          if (wantsVoice) {
            triggerBackgroundVoice(botMsgId, streamedText);
          }
          return;
        }
      }

      // Attempt 2: Fast unary endpoint fallback
      const unaryRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          userProfile,
          memories,
        }),
      });

      if (!unaryRes.ok) {
        throw new Error(`Chat request failed with status ${unaryRes.status}`);
      }

      const data = await unaryRes.json();
      const botReply = data.reply || "Hehe, that's really interesting! Tell me more about that.";
      const secondBubble = data.secondBubble || '';

      if (data.mood) setCurrentMood(data.mood);
      if (data.activityStatus) setActivityStatus(data.activityStatus);
      if (data.suggestedPrompts && Array.isArray(data.suggestedPrompts)) {
        setSuggestedPrompts(data.suggestedPrompts);
      }

      // Add memory if extracted
      if (data.newMemory && data.newMemory.trim()) {
        const newMem: Memory = {
          id: `mem-${Date.now()}`,
          note: data.newMemory.trim(),
          createdAt: Date.now(),
        };
        setMemories((prev) => [newMem, ...prev.slice(0, 15)]);
      }

      // Render answer immediately without artificial delay
      const botMessage: Message = {
        id: botMsgId,
        sender: 'bot',
        text: botReply,
        timestamp: Date.now(),
      };

      if (userProfile.soundEffects) {
        soundEffects.playReceive();
      }

      setMessages((prev) => [...prev, botMessage]);

      // If voice note was requested, fetch in background without delaying text
      if (wantsVoice) {
        triggerBackgroundVoice(botMsgId, botReply);
      }

      // If there's an optional second bubble, show it after a tiny 300ms pause
      if (secondBubble && secondBubble.trim()) {
        setTimeout(() => {
          const secondMsg: Message = {
            id: `bot-2-${Date.now()}`,
            sender: 'bot',
            text: secondBubble.trim(),
            timestamp: Date.now(),
          };
          if (userProfile.soundEffects) {
            soundEffects.playReceive();
          }
          setMessages((prev) => [...prev, secondMsg]);
        }, 300);
      }
    } catch (err: any) {
      console.error('Error generating reply:', err);
      const fallbackMsg: Message = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: "Annyeong! I'm right here—tell me what's on your mind! 😊",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handlers for moments & memories
  const handleAddMemory = (note: string) => {
    const newMem: Memory = {
      id: `mem-${Date.now()}`,
      note,
      createdAt: Date.now(),
    };
    setMemories((prev) => [newMem, ...prev]);
  };

  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleDiscussMoment = (moment: Moment) => {
    handleSendMessage(`Hey In-ah! I saw your photo "${moment.title}" at ${moment.location}. Tell me the story behind it!`);
  };

  const handleClearChat = () => {
    if (confirm('Clear message history and start a new chat with Seol-In-ah?')) {
      setMessages(INITIAL_MESSAGES);
      setIsProfileOpen(false);
    }
  };

  // Simulated Voice Call
  const startSimulatedCall = () => {
    setIsCallingModal(true);
    setCallStatus('ringing');
    setTimeout(() => {
      setCallStatus('connected');
      // Speak greeting
      requestVoiceNote("Annyeong! I'm so happy you called! How are you doing right now?")
        .then((audio) => {
          const a = new Audio(`data:audio/wav;base64,${audio}`);
          a.play().catch(() => {});
        })
        .catch(() => {});
    }, 2800);
  };

  return (
    <div className="flex h-screen w-screen bg-[#F8F9FA] dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans overflow-hidden">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex flex-col w-84 xl:w-96 border-r border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0 h-full overflow-hidden">
        {/* Profile Card Header */}
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex flex-col items-center text-center">
          <div className="relative cursor-pointer" onClick={() => setIsProfileOpen(true)}>
            <img
              src="/src/assets/images/seol_in_ah_avatar_1791636771858.jpg"
              alt="Seol-In-ah"
              className="w-20 h-20 rounded-full object-cover shadow-sm ring-4 ring-rose-50 dark:ring-stone-800 hover:scale-102 transition-transform"
            />
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-stone-900 rounded-full" />
          </div>

          <h1 className="mt-3 text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            Seol-In-ah <span className="text-xs text-stone-400 font-normal">설인아</span>
          </h1>
          <p className="text-xs text-rose-500 font-medium">@_seorina</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 line-clamp-2 px-2">
            South Korean actress · Dog mom to Julie 🐾 · Lifelike companion
          </p>

          {/* Quick status */}
          <div className="mt-3.5 w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {currentMood}
            </span>
            <span className="text-stone-400 text-[10px] truncate max-w-[150px]">
              {activityStatus}
            </span>
          </div>
        </div>

        {/* Moments Showcase Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Recent Moments
            </h3>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {INITIAL_MOMENTS.map((m) => (
              <div
                key={m.id}
                onClick={() => setInspectingMoment(m)}
                className="group cursor-pointer rounded-xl overflow-hidden border border-stone-200/70 hover:border-rose-300 transition-all bg-stone-50 dark:bg-stone-800/40 p-2 flex gap-3 items-center"
              >
                <img
                  src={m.image}
                  alt={m.title}
                  className="w-16 h-16 rounded-lg object-cover shrink-0 group-hover:scale-103 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-stone-400">{m.timeAgo}</div>
                  <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                    {m.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                    {m.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Memory Banner */}
          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Shared Memories
              </span>
              <span className="text-[10px] bg-white dark:bg-stone-800 px-1.5 py-0.5 rounded-full shadow-2xs">
                {memories.length} notes
              </span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400">
              Seol-In-ah remembers your favorite topics and conversations across sessions.
            </p>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-1.5 hover:text-stone-900 dark:hover:text-stone-100 transition-colors font-medium"
          >
            <Info className="w-4 h-4 text-stone-400" /> Bio & Preferences
          </button>
          <button
            onClick={startSimulatedCall}
            className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-medium"
          >
            <Phone className="w-3.5 h-3.5" /> Voice Call
          </button>
        </div>
      </aside>

      {/* ================= MAIN CHAT AREA ================= */}
      <main className="flex-1 flex flex-col h-full bg-[#FBFBFB] dark:bg-stone-950 relative">
        {/* Top App Bar */}
        <header className="h-16 px-4 sm:px-6 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between shrink-0 z-20">
          {/* Left: Avatar + Title */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setIsProfileOpen(true)}
          >
            <div className="relative">
              <img
                src="/src/assets/images/seol_in_ah_avatar_1791636771858.jpg"
                alt="Seol-In-ah"
                className="w-10 h-10 rounded-full object-cover border border-stone-200 shadow-2xs group-hover:opacity-90"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Seol-In-ah
                </h2>
                <span className="text-xs text-stone-400">설인아</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Online</span>
                <span>·</span>
                <span className="text-stone-400 hidden sm:inline">{activityStatus}</span>
              </div>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Auto Voice toggle quick button */}
            <button
              onClick={() =>
                setUserProfile((p) => ({ ...p, autoVoice: !p.autoVoice }))
              }
              className={`p-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                userProfile.autoVoice
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                  : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title={userProfile.autoVoice ? 'Voice replies enabled' : 'Click to enable voice replies'}
            >
              {userProfile.autoVoice ? (
                <>
                  <Volume2 className="w-4 h-4 text-rose-500" />
                  <span className="hidden md:inline">Voice ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-stone-400" />
                  <span className="hidden md:inline">Voice OFF</span>
                </>
              )}
            </button>

            {/* Voice call action */}
            <button
              onClick={startSimulatedCall}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors flex items-center gap-1"
              title="Voice Call with Seol-In-ah"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Call</span>
            </button>

            {/* Moments drawer on mobile */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
              aria-label="Open profile details"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-3">
          {/* Subtle date separator */}
          <div className="flex items-center justify-center my-4">
            <span className="text-[11px] font-medium text-stone-400 bg-stone-100/80 dark:bg-stone-800/60 px-3 py-1 rounded-full">
              Today · Seol-In-ah is active
            </span>
          </div>

          {/* Render Messages */}
          {messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const showAvatar = !prevMsg || prevMsg.sender !== msg.sender;
            return (
              <ChatBubble
                key={msg.id}
                message={msg}
                showAvatar={showAvatar}
                onImageClick={(url) => {
                  const m = INITIAL_MOMENTS.find((item) => item.image === url);
                  if (m) setInspectingMoment(m);
                }}
              />
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-end gap-2.5 my-2">
              <img
                src="/src/assets/images/seol_in_ah_avatar_1791636771858.jpg"
                alt="Seol-In-ah"
                className="w-8 h-8 rounded-full object-cover border border-stone-200"
              />
              <div className="bg-white dark:bg-stone-800 border border-stone-200/70 dark:border-stone-700/70 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-stone-400 ml-1.5">In-ah is typing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Carousel */}
        {suggestedPrompts.length > 0 && !isTyping && (
          <div className="px-4 sm:px-6 py-2 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-stone-900 dark:via-stone-900/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-medium text-stone-400 shrink-0">
              Suggestions:
            </span>
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="text-xs text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200/90 dark:border-stone-700 hover:border-rose-400 hover:text-rose-600 rounded-full px-3 py-1.5 shrink-0 transition-all shadow-2xs active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-stone-900 border-t border-stone-200/80 dark:border-stone-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 max-w-4xl mx-auto"
          >
            {/* View moments / Photo trigger */}
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-rose-500 transition-colors shrink-0"
              title="View Seol-In-ah Moments"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Speech to Text Microphone */}
            <button
              type="button"
              onClick={toggleMic}
              className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Click to speak using microphone'}
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* Text Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? 'Listening to your voice...' : 'Message Seol-In-ah...'}
                className="w-full py-3 px-4 pr-10 text-sm bg-stone-100 dark:bg-stone-800 rounded-2xl border border-transparent focus:border-rose-400 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden transition-all text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
              />
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="p-3 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:hover:bg-rose-500 text-white transition-all shadow-sm active:scale-95 shrink-0 flex items-center justify-center"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </main>

      {/* ================= SIMULATED VOICE CALL MODAL ================= */}
      {isCallingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-stone-900 text-white p-8 flex flex-col items-center text-center shadow-2xl border border-stone-800">
            <div className="relative my-4">
              <img
                src="/src/assets/images/seol_in_ah_avatar_1791636771858.jpg"
                alt="Seol-In-ah"
                className={`w-28 h-28 rounded-full object-cover border-4 border-rose-500 shadow-lg ${
                  callStatus === 'ringing' ? 'animate-pulse' : ''
                }`}
              />
              {callStatus === 'connected' && (
                <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-stone-900 rounded-full" />
              )}
            </div>

            <h3 className="text-xl font-bold">Seol-In-ah</h3>
            <p className="text-xs text-rose-400 mt-1 font-medium">설인아</p>
            <p className="text-sm text-stone-400 mt-2 font-mono">
              {callStatus === 'ringing' && 'Ringing...'}
              {callStatus === 'connected' && '00:14 · Connected'}
              {callStatus === 'ended' && 'Call ended'}
            </p>

            <div className="mt-8 flex items-center gap-6">
              <button
                onClick={() => {
                  setIsCallingModal(false);
                  setCallStatus('ended');
                }}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
                aria-label="End call"
              >
                <Phone className="w-6 h-6 rotate-135" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PROFILE & MOMENTS DRAWER ================= */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        moments={INITIAL_MOMENTS}
        memories={memories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onSelectMoment={(moment) => {
          setIsProfileOpen(false);
          setInspectingMoment(moment);
        }}
        userProfile={userProfile}
        onUpdateProfile={(updated) => setUserProfile((prev) => ({ ...prev, ...updated }))}
        onClearChat={handleClearChat}
        currentMood={currentMood}
        activityStatus={activityStatus}
      />

      {/* ================= PHOTO LIGHTBOX MODAL ================= */}
      <PhotoModal
        moment={inspectingMoment}
        onClose={() => setInspectingMoment(null)}
        onDiscuss={handleDiscussMoment}
      />
    </div>
  );
}
