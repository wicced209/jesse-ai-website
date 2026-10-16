document.addEventListener('DOMContentLoaded', () => {
    const terminalOutput = document.getElementById('terminal-output');
    const terminalForm = document.getElementById('terminal-form');
    const terminalInput = document.getElementById('terminal-input');

    const API_BASE = 'https://web-production-5d719b.up.railway.app';
    const DEMO_ENDPOINT = API_BASE + '/demo/command';

    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const appendMessage = (sender, text) => {
        const wrap = document.createElement('div');
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
        const label = sender === 'SYSTEM' ? 'JESSE AI' : sender === 'ERROR' ? 'ERROR' : 'YOU';
        const cls = sender === 'SYSTEM' ? 'msg msg-jesse' : sender === 'ERROR' ? 'msg msg-error' : 'msg msg-you';
        wrap.className = cls;
        wrap.innerHTML = '<div class="who"><span class="time">[' + timestamp + ']</span>' + label + '</div>'
            + '<div class="body">' + text + '</div>';
        terminalOutput.appendChild(wrap);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    };

    terminalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const command = terminalInput.value.trim();
        if (!command) return;

        appendMessage('USER', escapeHtml(command));
        terminalInput.value = '';
        terminalInput.disabled = true;

        const thinking = document.createElement('div');
        thinking.className = 'msg msg-jesse';
        thinking.innerHTML = '<div class="who">JESSE AI</div><div class="body">Thinking...</div>';
        terminalOutput.appendChild(thinking);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;

        try {
            const response = await fetch(DEMO_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command, use_llm: true }),
            });

            thinking.remove();

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                appendMessage('ERROR', escapeHtml(errData.error || 'Server error. Please try again.'));
                return;
            }

            const data = await response.json();
            const reply = data.jesse_ai_response || data.message || 'Command received. No text response generated.';
            appendMessage('SYSTEM', escapeHtml(reply));

        } catch (err) {
            thinking.remove();
            appendMessage('ERROR', 'Could not reach Jesse AI. The server may be restarting. Please try again in a moment.');
        } finally {
            terminalInput.disabled = false;
            terminalInput.focus();
        }
    });

    appendMessage('SYSTEM', 'Welcome to Jesse AI. Type a message below and I will respond.');
});
