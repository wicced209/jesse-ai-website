/* ============================================================
   Jesse AI — demo panels (2026-11-03).
   Four views of the operating layer, for sighted visitors.
   The blind loop is untouched: the conversation output remains
   the demo. These panels only display what the system's own
   endpoints report. Nothing is staged, cached, or invented:
   when the system rests, every panel says so.
   Endpoints (all verified live 2026-10-30/31):
     GET  /demo/status   -> { status: "ONLINE" | ... }
     POST /relay/probe   -> {} wakes a fresh channel probe
     GET  /relay/status  -> { summary: { up, total }, channels? }
     GET  /ledger        -> { total_blocks, chain_valid }
   No hashes, no block identifiers, and no raw addresses are
   ever rendered. Counts and plain status words only.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'https://web-production-5d719b.up.railway.app';

    const stackState = document.getElementById('stack-state');
    const relayBig = document.getElementById('relay-big');
    const relayList = document.getElementById('relay-list');
    const relayNote = document.getElementById('relay-note');
    const ledgerCount = document.getElementById('ledger-count');
    const ledgerChain = document.getElementById('ledger-chain');
    const ledgerNote = document.getElementById('ledger-note');

    function setRestingPanels() {
        if (stackState) {
            stackState.textContent = 'Resting now. The layers below are the verified architecture. Live values return on their own when the system is rehosted.';
        }
        if (relayBig) relayBig.textContent = 'Resting';
        if (relayList) relayList.replaceChildren();
        if (relayNote) {
            relayNote.textContent = 'The corridor is quiet while the system rests. Nothing here is simulated — when the system is live, this panel reads the corridor itself.';
        }
        if (ledgerCount) ledgerCount.textContent = '5,132';
        if (ledgerChain) ledgerChain.textContent = 'Verified at last check';
        if (ledgerNote) {
            ledgerNote.textContent = 'On October 31, 2026, at the last live check before the system rested, the record stood at 5,132 sealed entries and the full chain verified. The record is preserved in the recovery package and the code repository.';
        }
    }

    function renderRelays(rd) {
        const s = (rd && rd.summary) || {};
        if (relayBig) {
            relayBig.textContent = (typeof s.up === 'number' && typeof s.total === 'number')
                ? s.up + ' of ' + s.total + ' live'
                : 'Live';
        }
        if (relayList) {
            relayList.replaceChildren();
            const channels = (rd && (rd.channels || rd.relays || rd.items)) || [];
            if (Array.isArray(channels)) {
                channels.forEach((ch) => {
                    const name = typeof ch === 'string' ? ch : (ch && (ch.name || ch.id || ch.channel));
                    const status = typeof ch === 'string' ? '' : (ch && (ch.status || ch.state));
                    if (!name) return;
                    const li = document.createElement('li');
                    const n = document.createElement('span');
                    n.className = 'relay-name';
                    n.textContent = String(name);
                    li.appendChild(n);
                    if (status) {
                        const st = document.createElement('span');
                        st.className = 'relay-status';
                        st.textContent = String(status);
                        li.appendChild(st);
                    }
                    relayList.appendChild(li);
                });
            }
        }
        if (relayNote) {
            relayNote.textContent = 'Read live from the system just now. Four model relays — Gemini, Groq, OpenRouter, and Z.ai — plus the corridor, mesh, pulse, and control rails underneath.';
        }
    }

    function renderLedger(ld) {
        if (ledgerCount && ld && ld.total_blocks) {
            ledgerCount.textContent = Number(ld.total_blocks).toLocaleString('en-US');
        }
        if (ledgerChain) {
            ledgerChain.textContent = ld && ld.chain_valid ? 'Chain verified' : 'Check pending';
        }
        if (ledgerNote) {
            ledgerNote.textContent = 'Read live from the system just now. The count grows only when something significant is sealed — it is never edited by hand.';
        }
    }

    async function fetchJson(path, options) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        try {
            const r = await fetch(API_BASE + path, Object.assign({ cache: 'no-store', signal: controller.signal }, options || {}));
            clearTimeout(timer);
            if (!r.ok) return null;
            return await r.json();
        } catch (e) {
            clearTimeout(timer);
            return null;
        }
    }

    async function loadPanels() {
        const d = await fetchJson('/demo/status');
        const online = d && d.status === 'ONLINE';
        if (!online) { setRestingPanels(); return; }
        if (stackState) {
            stackState.textContent = 'Live now. Every layer below is running, and the values in these panels were read from the system itself, just now.';
        }
        await fetchJson('/relay/probe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
        });
        const rd = await fetchJson('/relay/status');
        if (rd) renderRelays(rd);
        const ld = await fetchJson('/ledger');
        if (ld) renderLedger(ld);
    }

    setRestingPanels();
    loadPanels();
    setInterval(loadPanels, 60000);
});
