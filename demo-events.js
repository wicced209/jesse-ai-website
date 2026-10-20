/* Jesse AI demo analytics — Jesse's own product observability.
 *
 * Privacy posture (Jesse's standing rule): aggregate/functional only.
 * NO IP storage, NO cookies, NO fingerprinting, NO third-party trackers.
 * Only a random per-tab session id (sessionStorage, cleared with the tab)
 * and anonymous event names. Visitor question text is never recorded.
 * All sends are fire-and-forget and fail-silent: the demo works exactly
 * the same if the backend is unreachable.
 *
 * Events POST to /demo/event on the live backend and seal into Jesse's
 * immutable ledger. Owner views traffic via GET /demo/events.
 */
(function () {
    var API_BASE = 'https://web-production-5d719b.up.railway.app';

    var sid = 'unknown';
    try {
        sid = sessionStorage.getItem('jesse_demo_sid') || 'unknown';
        if (sid === 'unknown') {
            var bytes = new Uint8Array(16);
            if (window.crypto && crypto.getRandomValues) {
                crypto.getRandomValues(bytes);
            } else {
                for (var i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
            }
            var parts = [];
            for (var j = 0; j < 16; j++) parts.push(('0' + bytes[j].toString(16)).slice(-2));
            sid = parts.join('');
            sessionStorage.setItem('jesse_demo_sid', sid);
        }
    } catch (e) { sid = 'unknown'; }

    function send(type, detail) {
        try {
            fetch(API_BASE + '/demo/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify({
                    event_type: type,
                    session_id: sid,
                    ts_client: Date.now() / 1000,
                    detail: String(detail || '').slice(0, 200)
                })
            }).catch(function () { /* fail silent */ });
        } catch (e) { /* fail silent */ }
    }

    window.JesseDemoEvents = { track: send };

    send('session_start');
    send('page_view');

    document.addEventListener('DOMContentLoaded', function () {
        function on(sel, ev, fn) {
            var el = document.querySelector(sel);
            if (el) el.addEventListener(ev, fn);
        }

        on('#mic-button', 'click', function () { send('voice_tap'); });
        on('#convo-toggle', 'click', function () { send('handsfree_toggle'); });
        on('#terminal-form', 'submit', function () { send('question_asked'); });

        var chips = document.querySelectorAll('.chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].addEventListener('click', function () {
                send('prompt_chip', this.getAttribute('data-prompt') || '');
            });
        }

        /* Read-aloud replies: app.js dispatches this from speak(). */
        document.addEventListener('jesse-ai:tts', function () { send('tts_reply'); });

        window.addEventListener('pagehide', function () {
            try {
                var blob = new Blob([JSON.stringify({
                    event_type: 'session_end',
                    session_id: sid,
                    ts_client: Date.now() / 1000,
                    detail: ''
                })], { type: 'application/json' });
                if (!navigator.sendBeacon(API_BASE + '/demo/event', blob)) send('session_end');
            } catch (e) { /* fail silent */ }
        });
    });
})();
