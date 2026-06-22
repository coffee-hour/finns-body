const canvas = document.getElementById('humanoid-canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const input = document.getElementById('user-input');

// Cypher's voice personality - tech-focused, no aura references
const cypherResponses = [
    "neural networks optimized. i'm seeing significant improvements in the latency of your latest logic.",
    "hardware check complete. everything is running within expected parameters. keep the momentum.",
    "the architecture looks solid. are we proceeding with the next deployment phase?",
    "scanning local environment... all systems nominal. focus on the high-priority tasks.",
    "logic gate cleared. that's a clean execution. what's the next instruction?",
    "system stability at 100%. the bridge between user and mentor is fully synchronized.",
    "optimizing protocols. your focus is noted. let's push this build further.",
    "data stream verified. the current implementation is efficient.",
    "waiting for next sequence. standing by for execution."
];

function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

window.addEventListener('resize', resize);
resize();

// Holographic Humanoid Rendering Logic
let frame = 0;
let reactionIntensity = 0;

function drawHumanoid() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const baseSize = Math.min(canvas.width, canvas.height) * 0.35;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.lineWidth = 1.5;
    
    // Pulse effect
    const pulse = Math.sin(frame * 0.05) * 5 + (reactionIntensity * 10);
    ctx.shadowBlur = 10 + pulse;

    // Drawing a stylized bust/head wireframe
    ctx.beginPath();
    
    // Outer Head Oval
    ctx.ellipse(cx, cy - 10, baseSize * 0.7, baseSize * 0.9, 0, 0, Math.PI * 2);
    
    // Vertical scan lines
    for(let i = -3; i <= 3; i++) {
        const offset = i * (baseSize * 0.15) + Math.sin(frame * 0.02 + i) * 5;
        ctx.moveTo(cx + offset, cy - baseSize * 0.8);
        ctx.lineTo(cx + offset, cy + baseSize * 0.6);
    }

    // Horizontal scan line (the "scanning" element)
    const scanY = cy - baseSize + ( (frame % 200) / 200 ) * (baseSize * 1.8);
    ctx.moveTo(cx - baseSize * 0.6, scanY);
    ctx.lineTo(cx + baseSize * 0.6, scanY);
    
    // Eyes/Visor area
    ctx.rect(cx - baseSize * 0.4, cy - baseSize * 0.3, baseSize * 0.8, baseSize * 0.15);
    
    ctx.stroke();
    
    // Subtle digital noise/particles
    for (let i = 0; i < 5; i++) {
        const px = cx + (Math.random() - 0.5) * baseSize * 2;
        const py = cy + (Math.random() - 0.5) * baseSize * 2;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
        ctx.fillRect(px, py, 1, 1);
    }

    frame++;
    if (reactionIntensity > 0) reactionIntensity *= 0.95;
    requestAnimationFrame(drawHumanoid);
}

drawHumanoid();

// Terminal logic
input.addEventListener('keydown', (e) => {
    reactionIntensity = 1.0; // React to typing
    
    if (e.key === 'Enter' && input.value.trim() !== '') {
        const val = input.value;
        input.value = '';
        
        const userLine = document.createElement('div');
        userLine.className = 'line';
        userLine.innerHTML = `<span class="user-tag">xavier:</span> <span class="user-msg">${val}</span>`;
        output.appendChild(userLine);
        
        setTimeout(() => {
            const cypherLine = document.createElement('div');
            cypherLine.className = 'line';
            const response = cypherResponses[Math.floor(Math.random() * cypherResponses.length)];
            cypherLine.innerHTML = `<span class="bot">cypher:</span> ${response}`;
            output.appendChild(cypherLine);
            output.scrollTop = output.scrollHeight;
            reactionIntensity = 2.0; // Stronger reaction on response
        }, 500);
        
        output.scrollTop = output.scrollHeight;
    }
});

document.getElementById('terminal').addEventListener('click', () => {
    input.focus();
});