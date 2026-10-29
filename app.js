document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('terminal-output');
    const form = document.getElementById('terminal-form');
    const input = document.getElementById('terminal-input');
    const sendButton = document.getElementById('send-button');
    const micButton = document.getElementById('mic-button');
    const micNote = document.getElementById('mic-note');
    const voiceToggle = document.getElementById('voice-toggle');
    const statusPill = document.getElementById('status-pill');
    const statusText = document.getElementById('status-text');
    const convoToggle = document.getElementById('convo-toggle');
    let convoMode = false;

    const API_BASE = 'https://web-production-5d719b.up.railway.app';

    /* ---------- helpers ---------- */

    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const stamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    /* Jesse: visitors see Jesse AI's answer, not hashes or blocks.
       One cleanup path for BOTH the screen and the spoken voice:
       internal system lines and raw formatting marks never reach a
       visitor, in any position, in either mode. */
    /* CLEANUP START */
    const INTERNAL_LINE = [
        /sovereign living master key/i,
        /sovereign boot context/i,
        /crsmcpai alpha v2\s*[\u2014\u2013-]/i,
        /^\s*#?\s*block\s*(number)?\s*[:#]/i,
        /genesis anchor/i,
        /^\s*[0-9a-f]{64}\s*$/i,
        /^\s*status\s*:\s*.*(sovereign|secure\s*\/|online\s*\/\/)/i,
        /^\s*superadmin\s*:/i,
        /^\s*verification\s*:/i,
        /execution confirmed/i,
        /^\s*command recall\s*:/i,
    ];
    const isInternalLine = (line) => INTERNAL_LINE.some((re) => re.test(line));

    function plainText(text) {
        return String(text)
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/`([^`]*)`/g, '$1')
            .replace(/^\s{0,3}#{1,6}\s+/gm, '')
            .replace(/^\s*[-*]\s+/gm, '\u2022 ');
    }

    function cleanResponse(text) {
        let lines = String(text).split('\n');
        // Drop internal system lines wherever they appear
        lines = lines.filter((line) => !isInternalLine(line));
        // Drop the leading [bracketed] header block
        while (lines.length && /^\s*`?\[[^\]]*\]`?\s*$/.test(lines[0])) lines.shift();
        // Drop leading and trailing blank lines
        while (lines.length && /^\s*$/.test(lines[0])) lines.shift();
        while (lines.length && /^\s*$/.test(lines[lines.length - 1])) lines.pop();
        return plainText(lines.join('\n')).trim();
    }
    /* CLEANUP END */

    function appendMessage(sender, text) {
        const wrap = document.createElement('div');
        const label = sender === 'SYSTEM' ? 'Jesse AI' : sender === 'ERROR' ? 'Notice' : 'You';
        const cls = sender === 'SYSTEM' ? 'msg msg-jesse'
            : sender === 'ERROR' ? 'msg msg-error' : 'msg msg-you';
        wrap.className = cls;
        wrap.innerHTML =
            '<div class="who"><span>' + label + '</span>' +
            '<span class="time">' + stamp() + '</span></div>' +
            '<div class="body">' + text + '</div>';
        output.appendChild(wrap);
        output.scrollTop = output.scrollHeight;
        return wrap;
    }

    function showTyping() {
        const t = document.createElement('div');
        t.className = 'msg msg-jesse';
        t.id = 'typing-row';
        t.innerHTML = '<div class="who"><span>Jesse AI</span></div>' +
            '<div class="body"><span class="typing-dots" aria-hidden="true">' +
            '<span></span><span></span><span></span></span>' +
            '<span class="sr-only">Jesse AI is thinking</span>' +
            '<div style="margin-top:6px;font-size:0.85em;opacity:0.85">Jesse AI is thinking. A reply can take up to about 30 seconds.</div></div>';
        output.appendChild(t);
        output.scrollTop = output.scrollHeight;
    }

    function hideTyping() {
        const t = document.getElementById('typing-row');
        if (t) t.remove();
    }

    /* ---------- read-aloud (speech synthesis) ---------- */

    let voiceOn = false;
    let voices = [];
    const pickVoice = () => {
        voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
        return voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en') && /female|samantha|zira|google us english/i.test(v.name))
            || voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en'))
            || voices[0] || null;
    };
    if (window.speechSynthesis) {
        pickVoice();
        speechSynthesis.onvoiceschanged = pickVoice;
    }

    function speak(text) {
        if (!voiceOn || !window.speechSynthesis) return;
        speechSynthesis.cancel();
        const clean = cleanResponse(text).slice(0, 600);
        if (!clean) return;
        const u = new SpeechSynthesisUtterance(clean);
        const v = pickVoice();
        if (v) u.voice = v;
        u.rate = 1;
        speechSynthesis.speak(u);
        document.dispatchEvent(new CustomEvent('jesse-ai:tts')); /* analytics hook */
    }

    voiceToggle.addEventListener('click', () => {
        voiceOn = !voiceOn;
        voiceToggle.setAttribute('aria-pressed', String(voiceOn));
        if (!voiceOn && window.speechSynthesis) speechSynthesis.cancel();
    });

    /* ---------- microphone (speech recognition) ---------- */

    function stopListening() {
        micButton.classList.remove('listening');
        micButton.setAttribute('aria-label', 'Speak your message');
        micNote.hidden = true;
    }

    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    let rec = null;
    if (!Rec) {
        micButton.style.display = 'none';
        if (convoToggle) convoToggle.style.display = 'none';
    } else {
        rec = new Rec();
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onresult = (e) => {
            const said = e.results[0][0].transcript;
            stopListening();
            if (convoMode && said.trim()) {
                send(said.trim()); // hands-free: auto-send
            } else {
                input.value = said;
                input.focus();
            }
        };
        rec.onerror = () => stopListening();
        rec.onend = () => {
            stopListening();
            if (convoMode && window.speechSynthesis && !speechSynthesis.speaking) {
                setTimeout(startListening, 300);
            }
        };

        micButton.addEventListener('click', () => {
            if (micButton.classList.contains('listening')) {
                rec.stop();
                return;
            }
            try {
                rec.start();
                micButton.classList.add('listening');
                micButton.setAttribute('aria-label', 'Stop listening');
                micNote.hidden = false;
                input.focus();
            } catch (err) {
                stopListening();
            }
        });
    }

    /* ---------- hands-free conversation mode ---------- */
    /* Tap once: speak -> Jesse AI answers aloud -> auto-listens again. */

    function setConvoMode(on) {
        convoMode = on;
        convoToggle.setAttribute('aria-pressed', String(on));
        convoToggle.classList.toggle('active', on);
        if (on) {
            if (!voiceOn) voiceToggle.click(); // replies must be spoken
            appendMessage('SYSTEM', 'Conversation mode on. Speak, and Jesse AI will answer. Tap the phone button to stop.');
            startListening();
        } else {
            if (window.speechSynthesis) speechSynthesis.cancel();
            stopListening();
            appendMessage('SYSTEM', 'Conversation mode off.');
        }
    }

    function startListening() {
        if (!rec || !convoMode) return;
        try {
            rec.start();
            micButton.classList.add('listening');
            micButton.setAttribute('aria-label', 'Stop listening');
            micNote.hidden = false;
        } catch (err) { /* already listening */ }
    }

    // Speak, then auto-listen when the reply finishes.
    const _origSpeak = speak;
    speak = function (text) {
        if (!convoMode) { _origSpeak(text); return; }
        if (!window.speechSynthesis) { _origSpeak(text); return; }
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(cleanResponse(text));
        u.rate = 1.0;
        if (voices.length) u.voice = voices[0];
        u.onend = () => { setTimeout(startListening, 400); };
        u.onerror = () => { setTimeout(startListening, 400); };
        speechSynthesis.speak(u);
        document.dispatchEvent(new CustomEvent('jesse-ai:tts')); /* analytics hook */
    };

    if (convoToggle) {
        convoToggle.addEventListener('click', () => setConvoMode(!convoMode));
    }

    document.querySelectorAll('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            if (input.disabled) return;
            input.value = chip.getAttribute('data-prompt');
            if (form.requestSubmit) form.requestSubmit();
            else input.focus();
        });
    });

    /* ---------- live status (with timeout + tap-to-retry) ---------- */

    async function checkStatus() {
        statusText.textContent = 'Connecting';
        statusPill.classList.remove('online', 'offline');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        try {
            const r = await fetch(API_BASE + '/demo/status', { cache: 'no-store', signal: controller.signal });
            clearTimeout(timer);
            const d = r.ok ? await r.json() : null;
            const online = d && (d.status === 'ONLINE');
            statusPill.classList.toggle('online', online);
            statusPill.classList.toggle('offline', !online);
            statusText.textContent = online ? 'Live' : 'Offline — tap to retry';
        } catch (e) {
            clearTimeout(timer);
            statusPill.classList.add('offline');
            statusText.textContent = 'Offline — tap to retry';
        }
    }

    checkStatus();
    statusPill.addEventListener('click', checkStatus);

    /* ---------- send ---------- */

    async function send(text) {
        appendMessage('USER', escapeHtml(text));
        input.value = '';
        input.disabled = true;
        sendButton.disabled = true;
        showTyping();

        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 90000);
            const response = await fetch(API_BASE + '/demo/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: text, use_llm: true }),
                signal: controller.signal,
            });
            clearTimeout(timer);
            hideTyping();

            if (!response.ok) {
                appendMessage('ERROR', 'Jesse AI is busy right now. Please try again in a moment.');
                return;
            }
            const data = await response.json();
            const raw = data.jesse_ai_response || data.message || 'Message received.';
            const reply = cleanResponse(raw);
            appendMessage('SYSTEM', escapeHtml(reply));
            speak(reply);
        } catch (err) {
            hideTyping();
            appendMessage('ERROR', 'Could not reach Jesse AI. The server may be restarting. Please try again in a moment.');
        } finally {
            input.disabled = false;
            sendButton.disabled = false;
            input.focus();
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        send(text);
    });

    appendMessage('SYSTEM', 'Welcome to Jesse AI. Type below, tap a suggestion, or tap the microphone to speak.');
});
