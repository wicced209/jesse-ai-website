document.addEventListener('DOMContentLoaded', () => {
    const terminalOutput = document.getElementById('terminal-output');
    const terminalForm = document.getElementById('terminal-form');
    const terminalInput = document.getElementById('terminal-input');
    const clearButton = document.getElementById('clear-terminal');

    const API_BASE = 'https://web-production-5d719b.up.railway.app';
    const DEMO_ENDPOINT = API_BASE + '/demo/command';

    const appendMessage = (sender, text) => {
        const p = document.createElement('div');
        p.className = 'space-y-1';

        const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);

        if (sender === 'SYSTEM') {
            p.innerHTML = '<span class="text-slate-500">[' + timestamp + ']</span> <span class="text-amber-400 font-bold">JESSE AI:</span> <span class="text-slate-300">' + text + '</span>';
        } else if (sender === 'ERROR') {
            p.innerHTML = '<span class="text-slate-500">[' + timestamp + ']</span> <span class="text-red-400 font-bold">ERROR:</span> <span class="text-red-300">' + text + '</span>';
        } else {
            p.innerHTML = '<span class="text-slate-500">[' + timestamp + ']</span> <span class="text-emerald-400 font-bold">YOU:</span> <span class="text-slate-200">' + text + '</span>';
        }

        terminalOutput.appendChild(p);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    };

    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    terminalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const command = terminalInput.value.trim();
        if (!command) return;

        if (command.toLowerCase() === 'clear') {
            terminalOutput.innerHTML = '';
            terminalInput.value = '';
            return;
        }

        appendMessage('USER', escapeHtml(command));
        terminalInput.value = '';
        terminalInput.disabled = true;

        appendMessage('SYSTEM', 'Thinking...');

        try {
            const response = await fetch(DEMO_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command, use_llm: true }),
            });

            // Remove the "Thinking..." message
            terminalOutput.removeChild(terminalOutput.lastChild);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                appendMessage('ERROR', escapeHtml(errData.error || 'Server error. Please try again.'));
                return;
            }

            const data = await response.json();
            const reply = data.jesse_ai_response || data.message || 'Command received. No text response generated.';

            appendMessage('SYSTEM', escapeHtml(reply));

        } catch (err) {
            if (terminalOutput.lastChild) {
                terminalOutput.removeChild(terminalOutput.lastChild);
            }
            appendMessage('ERROR', 'Could not reach Jesse AI. The server may be restarting. Please try again in a moment.');
        } finally {
            terminalInput.disabled = false;
            terminalInput.focus();
        }
    });

    if (clearButton) {
        clearButton.addEventListener('click', () => {
            terminalOutput.innerHTML = '';
            appendMessage('SYSTEM', 'Terminal cleared.');
        });
    }

    // Welcome message
    appendMessage('SYSTEM', 'Welcome to Jesse AI. Type a message and I will respond through CRSMCPAI Alpha.');
});
