# Seol-In-ah (설인아) — Realistic Companion Messenger

An authentic, emotionally resonant chat application featuring **Seol-In-ah** (설인아), designed to feel like texting and talking with a real person in real time. It delivers natural conversation rhythms, expressive voice messages (TTS), dynamic daily status updates, photo moments, and persistent conversation memory with a warm, caring, and witty personality.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying questions were dismissed without selection, so we are adopting the recommended defaults:
> - **Persona & Dynamic**: Warm, witty, empathetic close friend and companion inspired by Seol-In-ah's charming, genuine personality.
> - **Interface Style**: Modern, responsive messenger interface adapted for both desktop widescreen (sidebar + active chat + profile detail) and mobile viewports with smooth touch feedback.
> - **Audio & Presence**: Server-side Gemini 3.8 Flash for hyper-realistic contextual messaging paired with Gemini TTS for voice audio notes, realistic typing cadence, and interactive moments.

---

### 1. Overview & Core Concept

- **What It Does**: 
  - Engages in hyper-realistic 1-on-1 messaging that feels like texting a real, thoughtful person. Seol-In-ah asks about your day, shares her own thoughts, jokes, remembers details you mention, and sends voice notes.
  - Generates realistic conversational voice notes on demand using Gemini Text-to-Speech with a gentle, expressive tone.
  - Features real-time typing indicators with realistic pause rhythms before messages arrive.
  - Supports personal photo/moment sharing (curated lifestyle moments like coffee breaks, dog walks, behind-the-scenes sets) and daily mood status.
  - Preserves persistent conversation history and key memories across sessions via local storage.

- **Target Audience / Persona**: Anyone looking for an engaging, uplifting, and genuine conversational companion who feels human, supportive, and delightfully real.

- **Key Value**: Moves beyond sterile assistant bots to create an emotional connection through human-like timing, relatable conversational habits, voice notes, and warm personality.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **First Impression & Welcome**: Clean messenger interface opens with Seol-In-ah's profile, active online status, and an organic greeting ("Hey! Just wrapped up some work. How's your day going?").
2. **Texting & Natural Rhythm**: User types a message; Seol-In-ah displays an active "typing..." indicator with human-like latency before sending a multi-bubble or single conversational reply.
3. **Voice Note Experience**: In addition to text, Seol-In-ah can send or be prompted to send voice audio notes with a dedicated audio waveform player, play/pause controls, and timestamp.
4. **Relationship & Memory Drawer**: A slide-out profile view detailing Seol-In-ah's status ("At a cafe with Julie ☕", "Listening to indie jazz"), shared photos/moments gallery, and key shared memories stored from past chats.
5. **Quick Conversational Starters**: Subtle suggestion pills ("Tell me about your day", "Need some advice", "Send me a voice note", "What are you up to?") that seamlessly initiate chats.

#### Visual Identity & Theme
- **Aesthetic Direction**: High-end modern messenger inspired by premium communication apps (KakaoTalk, iMessage, and Line) blended with gentle Korean minimalist aesthetics.
- **Color Palette**:
  - Neutral Canvas: Soft warm alabaster (`#FBFBFB`) and sleek dark charcoal slate (`#0F172A`) in dark mode.
  - Primary Surface: Pure white cards (`#FFFFFF`) with whisper hairline borders (`border-stone-200/70`).
  - Accent Tone: Warm Rose/Peach accent (`#E11D48` / `#F43F5E` / `#FB7185`) paired with calm Sage Green for active presence.
  - Chat Bubbles: Soft pastel rose/peach gradient for user bubbles; crisp stone white with subtle border for Seol-In-ah bubbles.
- **Typography**: Clean display and body type using `Plus Jakarta Sans` and `Outfit`, with tabular numbers for timestamps and duration counters.
- **Anti-Slop Discipline**: No garish purple neon gradients, no mechanical `//` comments, no fake status scoreboards, zero static pill capsules on metadata, and real functional controls throughout.

---

### 3. Key Product Decisions & Trade-Offs

- **Server-Side Gemini Integration**:
  - *Chosen Approach*: Node/Express server proxy (`/api/chat` and `/api/tts`) utilizing `@google/genai` with `gemini-3.8-flash` for high-speed, human-like dialogue and `gemini-3.8-flash-lite-tts` for high-quality audio notes.
  - *Why*: Adheres to security rules (API key never exposed to client) and provides robust streaming/JSON error propagation.
  
- **Persona Crafting & Memory System**:
  - *Chosen Approach*: Rich system prompt encoding Seol-In-ah's personality (playful, empathetic, natural sentence variety, occasional Korean friendly greetings like "Annyeong!", casual punctuation, emoji restraint) combined with local client memory storage for context continuity.
  - *Why*: Ensures the chatbot genuinely sounds like an authentic individual rather than a canned customer service agent.

- **Audio Playback**:
  - *Chosen Approach*: Server returns audio base64 generated via Gemini TTS, played directly via HTML5 Audio / Blob with a tactile waveform visualizer.
  - *Why*: Zero external third-party speech dependencies; fast and reliable.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend UI                           │
│  ┌──────────────────────┬────────────────────────────────┐  │
│  │   Desktop Sidebar    │       Active Chat Screen       │  │
│  │  - Persona Header    │  - Message Thread (Bubbles)    │  │
│  │  - Profile & Status  │  - Waveform Voice Players      │  │
│  │  - Moments Gallery   │  - Realistic Typing Indicator  │  │
│  │  - Memory Notebook   │  - Message Input & Mic Action  │  │
│  └──────────────────────┴────────────────────────────────┘  │
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTP / JSON API
┌──────────────────────────────▼──────────────────────────────┐
│                  Server-Side Express Proxy                  │
│  - POST /api/chat   -> GoogleGenAI (gemini-3.8-flash)       │
│  - POST /api/voice  -> GoogleGenAI (gemini-3.8-flash-lite-tts)
│  - Serves built Vite frontend assets in production          │
└─────────────────────────────────────────────────────────────┘
```

#### State & Storage
- `messages`: Array of chat messages `{ id, sender: 'user' | 'bot', text, audioUrl?, timestamp, status }`.
- `userProfile`: Local nickname and preference settings.
- `memories`: Key remembered facts about the user for personalized conversation context.
- `localStorage`: Auto-sync for message history and memory persistence.
