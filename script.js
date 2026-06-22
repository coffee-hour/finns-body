/**
 * CYPHER TERMINAL v11.0.0
 * Sketchfab 3D Core Integration
 */

const output = document.getElementById('output');
const input = document.getElementById('user-input');
const iframe = document.getElementById('sketchfab-core');

const responses = [
    "neural mesh synchronized. sketchfab core is operational.",
    "chromatic filters applied. biometric aesthetic locked to cyber-yellow.",
    "identity verified. welcome, xavier.",
    "scanning local environment... uplink is secure.",
    "logic gates clear. ready for the next sequence.",
    "biometric resolution at maximum. neural bridge stable."
];

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
        const val = input.value;
        input.value = '';
        
        // Pulse effect on the 3D model when interacting
        if (iframe) {
            iframe.style.filter = 'sepia(1) saturate(7) hue-rotate(15deg) brightness(1.5) contrast(1.8) drop-shadow(0 0 30px rgba(255, 255, 0, 0.6))';
            setTimeout(() => {
                iframe.style.filter = 'sepia(1) saturate(5) hue-rotate(15deg) brightness(1.2) contrast(1.5) drop-shadow(0 0 20px rgba(255, 200, 0, 0.4))';
            }, 500);
        }

        const userLine = document.createElement('div');
        userLine.className = 'line';
        userLine.innerHTML = `<span class="user-tag">xavier:</span> <span class="user-msg">${val}</span>`;
        output.appendChild(userLine);
        
        setTimeout(() => {
            const botLine = document.createElement('div');
            botLine.className = 'line';
            const res = responses[Math.floor(Math.random() * responses.length)];
            botLine.innerHTML = `<span class="bot">cypher:</span> ${res}`;
            output.appendChild(botLine);
            output.scrollTop = output.scrollHeight;
        }, 550);
        
        output.scrollTop = output.scrollHeight;
    }
});

document.getElementById('terminal').addEventListener('click', () => input.focus());