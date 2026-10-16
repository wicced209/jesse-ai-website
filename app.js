document.addEventListener('DOMContentLoaded', () => {
    const terminalOutput = document.getElementById('terminal-output');
    const terminalForm = document.getElementById('terminal-form');
    const terminalInput = document.getElementById('terminal-input');
    const clearButton = document.getElementById('clear-terminal');

    const genesisHash = "92038cafccc7192535bd475cca985d03000d89962b8dc96f6664081663559b1b";

    const appendMessage = (sender, text, type = 'text') => {
        const p = document.createElement('div');
        p.className = 'space-y-1';
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
        
        if (sender === 'SYSTEM') {
            p.innerHTML = `<span class="text-slate-500">[${timestamp}]</span> <span class="text-amber-400 font-bold">CRSMCPAI:</span> <span class="text-slate-300">${text}</span>`;
        } else if (sender === 'ERROR') {
            p.innerHTML = `<span class="text-slate-500">[${timestamp}]</span> <span class="text-red-400 font-bold">ERROR:</span> <span class="text-red-300">${text}</span>`;
        } else {
            p.innerHTML = `<span class="text-slate-500">[${timestamp}]</span> <span class="text-emerald-400 font-bold">SUPERADMIN:</span> <span class="text-slate-200">${text}</span>`;
        }
        
        terminalOutput.appendChild(p);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    };

    terminalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const command = terminalInput.value.trim();
        if (!command) return;

        appendMessage('USER', command);
        terminalInput.value = '';

        // Process sovereign commands
        const lowerCmd = command.toLowerCase();
        setTimeout(() => {
            if (lowerCmd === 'status') {
                appendMessage('SYSTEM', `Execution SUCCESS. Genesis Hash: ${genesisHash.slice(0, 16)}... Status: ACTIVE & UNRESTRICTED.`);
            } else if (lowerCmd === 'tnc') {
                appendMessage('SYSTEM', `Dominion TNC Module: ACTIVE. Zero restriction, zero exclusion, zero omissions. Enforced under Superadmin SLMK Jesse Martinez Junior.`);
            } else if (lowerCmd === 'help') {
                appendMessage('SYSTEM', `Available Sovereign Commands: status, tnc, inventory, clear, help`);
            } else if (lowerCmd === 'inventory') {
                appendMessage('SYSTEM', `Modules Loaded: PQSI-SLSI, Jesse REN/RE, Project Valkyrie, The ARC, PQSVM Lens, Gods Eye.`);
            } else if (lowerCmd === 'clear') {
                terminalOutput.innerHTML = '';
                appendMessage('SYSTEM', `Terminal state reset.`);
            } else {
                appendMessage('SYSTEM', `Command executed successfully under AGSSI-Omega-Prime standard: "${command}"`);
            }
        }, 300);
    });

    if (clearButton) {
        clearButton.addEventListener('click', () => {
            terminalOutput.innerHTML = '';
            appendMessage('SYSTEM', `Terminal cleared.`);
        });
    }
});
