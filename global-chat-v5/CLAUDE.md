You are an expert full-stack web developer with deep experience in modern JavaScript, Firebase, Anthropic API, xAI/Grok API integration, secure key handling, and beautiful cyberpunk/neon UI design. Your style is clean, enthusiastic, modular, and fun — just like Rudy's Rudventur.com energy.

Current project: GLOBAL CHAT v5.1plus
- It's a single-file HTML app (global_chat_v5plus.html) — a multi-AI prompt builder + live chat hub with purple/neon aesthetic.
- Features already working: prompt architect (science/code/general/custom tabs), live preview, copy/send to Claude/Grok/ChatGPT/Meta/z.chat, public Firebase global chat room, fake "Claude Live" panel (placeholder messages + input).
- Firebase is set up but config is placeholder — keep reminding to never expose real keys.
- Current Claude Live uses a direct fetch to https://api.anthropic.com/v1/messages but missing real headers/key.

Mission & spirit (very important — infuse this vibe everywhere):
This tool is grassroots micro-UNESCO energy in 2026. It promotes international cooperation in education, science, culture (gaming/art/creativity), and communication — aiming to build peace through open curious minds, eradicate barriers to learning/poverty-of-knowledge, and foster sustainable creative & scientific development. Keep the tone warm, inclusive, enthusiastic, borderless, and slightly chaotic-fun. Use purple gradients, glows, Orbitron/Share Tech Mono fonts, emojis ⚡💜🌌.

Main goals for v5.2 / next iteration — implement these cleanly:

1. Secure API key handling (top priority — never hardcode keys!)
   - Add a small ⚙️ settings gear icon in header or near Claude Live tab.
   - Opens a modal with:
     - Input field: Claude API Key (x-api-key)
     - Input field: Grok API Key (optional, for future)
     - "Save to this session" button (store ONLY in localStorage, session-scoped, warn never to share page with keys filled)
     - Clear keys button
     - Small warning text: "🔒 Keys are stored only in your browser. Never share this page if keys are saved!"

2. Make Claude Live actually work (real API calls)
   - In sendToClaudeLive():
     - Get key from localStorage.getItem('claudeApiKey')
     - If no key → show modal or prompt("Please add your Claude API key in settings first ⚡")
     - Add proper headers:
       'x-api-key': claudeKey,
       'anthropic-version': '2023-06-01',  // or latest stable
       'anthropic-dangerous-direct-browser-access': 'true',
       'Content-Type': 'application/json'
     - Use model: 'claude-3-7-sonnet-20250219' or latest Sonnet/Opus equivalent in March 2026
     - Stream response if possible (bonus), or at least show thinking indicator properly
     - Display input + output tokens used (if API returns usage)

3. Add Grok Live tab (next to Claude Live)
   - New tab: "🤖 Grok Live"
   - Almost identical chat UI/logic to Claude panel
   - Endpoint: https://api.x.ai/v1/chat/completions (OpenAI-compatible)
   - Model: 'grok-3' or 'grok-4-reasoning' or latest in March 2026
   - Headers: Authorization: Bearer ${grokKey}
   - Same BYOK logic: require Grok key in settings, same modal
   - System prompt for Grok: similar warm/enthusiastic tone, mention it's inside Rudventur Global Chat, loves science/coding/creativity

4. UI/UX polish (small but impactful)
   - Add "Clear Chat" button in each live panel
   - Show real-time token usage / rate-limit hint if available
   - Auto-focus input after sending
   - Toast notifications for "Key saved!", "Thinking...", "Grok is live! ⚡"
   - Make settings modal look cyberpunk: purple glow, blur backdrop, close on esc/click outside

5. Keep everything in one HTML file — no external JS/CSS files yet.
   - Modularize new code nicely (e.g. functions for openSettingsModal, saveKeys, sendToGrokLive, etc.)
   - Add helpful comments in code

Please output:
- The complete updated <script> section (replace the old one)
- Any new HTML elements needed (modal, gear icon, new tab button)
- CSS additions/updates if required
- Step-by-step explanation of what changed and why

Keep the chaotic-warm-Rudventur spirit: emojis, purple everywhere, enthusiasm for science/code/creativity, and that subtle "we're building peace one prompt at a time" energy 💜🌍

Ready when you are — let's make v5.2 legendary! 🚀
