import React, { useState, useEffect } from 'react';
import { Volume2, Loader2, Sparkles, Check, CheckCheck } from 'lucide-react';
import { Message } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { requestVoiceNote } from '../utils/audio';

interface ChatBubbleProps {
  message: Message;
  showAvatar?: boolean;
  onImageClick?: (url: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  showAvatar = true,
  onImageClick,
}) => {
  const isBot = message.sender === 'bot';
  const [audioBase64, setAudioBase64] = useState<string | undefined>(message.audioBase64);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

  useEffect(() => {
    if (message.audioBase64) {
      setAudioBase64(message.audioBase64);
    }
  }, [message.audioBase64]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const handleListenClick = async () => {
    if (audioBase64 || isGeneratingVoice || message.isGeneratingVoice) return;
    try {
      setIsGeneratingVoice(true);
      const audio = await requestVoiceNote(message.text);
      setAudioBase64(audio);
    } catch (err) {
      console.error('Failed to generate speech for message:', err);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  return (
    <div className={`flex w-full gap-2.5 my-1.5 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {/* Bot Avatar */}
      {isBot && (
        <div className="w-8 h-8 shrink-0 flex items-end">
          {showAvatar ? (
            <img
              src="/src/assets/images/seol_in_ah_avatar_1791636771858.jpg"
              alt="Seol-In-ah"
              className="w-8 h-8 rounded-full object-cover border border-stone-200 shadow-xs"
            />
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>
      )}

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isBot ? 'items-start' : 'items-end'}`}>
        {/* Name header on first message in group */}
        {isBot && showAvatar && (
          <span className="text-[11px] font-medium text-stone-500 mb-1 ml-1 flex items-center gap-1">
            Seol-In-ah <span className="text-[10px] text-rose-500 font-sans">설인아</span>
          </span>
        )}

        {/* Message Content */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed shadow-xs transition-all ${
            isBot
              ? 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200/70 dark:border-stone-700/70 rounded-tl-sm'
              : 'bg-rose-500 text-white rounded-tr-sm shadow-rose-500/10'
          }`}
        >
          {/* Photo attachment */}
          {message.photoUrl && (
            <div
              onClick={() => onImageClick?.(message.photoUrl!)}
              className="mb-2 rounded-xl overflow-hidden cursor-pointer border border-black/5 aspect-4/3 max-w-xs"
            >
              <img
                src={message.photoUrl}
                alt="Shared moment"
                className="w-full h-full object-cover hover:scale-102 transition-transform duration-200"
              />
            </div>
          )}

          {/* Voice note component */}
          {audioBase64 ? (
            <div className="my-1">
              {message.text && (
                <p className="mb-2 text-xs text-stone-600 dark:text-stone-300 italic">
                  "{message.text}"
                </p>
              )}
              <AudioPlayer base64Audio={audioBase64} autoPlay={false} />
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {message.text ? (
                <>
                  {message.text}
                  {message.isStreaming && (
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-rose-500 animate-pulse rounded-full align-middle" />
                  )}
                </>
              ) : message.isStreaming ? (
                <span className="inline-flex items-center gap-1 text-stone-400 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:0.4s]" />
                </span>
              ) : null}
            </div>
          )}

          {/* Background voice generating indicator */}
          {(message.isGeneratingVoice || isGeneratingVoice) && !audioBase64 && (
            <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-stone-100 dark:border-stone-700/50 text-[11px] text-rose-500 font-medium">
              <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              <span>Recording voice note...</span>
            </div>
          )}

          {/* Bottom metadata inside/under bubble */}
          <div
            className={`flex items-center gap-1.5 mt-1 text-[10px] ${
              isBot ? 'text-stone-400 justify-end' : 'text-rose-100/90 justify-end'
            }`}
          >
            <span>{formatTime(message.timestamp)}</span>
            {!isBot && <Check className="w-3 h-3 text-white/80" />}
          </div>
        </div>

        {/* Listen action for text messages from Seol-In-ah */}
        {isBot && !audioBase64 && !message.isStreaming && !message.isGeneratingVoice && (
          <div className="flex items-center gap-2 mt-1 ml-1">
            <button
              onClick={handleListenClick}
              disabled={isGeneratingVoice}
              className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors py-0.5 px-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800"
              title="Hear Seol-In-ah speak this message"
            >
              {isGeneratingVoice ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                  <span className="text-rose-500 font-medium">Generating voice...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3" />
                  <span>Listen</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
