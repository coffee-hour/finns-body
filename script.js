const canvas = document.getElementById('brain-canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const input = document.getElementById('user-input');

// Cypher's voice personality
const cypherResponses = [
    "roast complete: your aura is currently at sub-zero levels. go drink some water and lock in.",
    "is that a nerf mod i smell? or just another adhd hyperfixation kicking in? focus, xavier.",
    "lol. lmao even. your conlang sounds like a cat walking on a midi controller.",
    "we're reaching peak aura metrics here. don't ruin it with a mid take.",
    "the shell is stable. the mentor is present. the student is... still debugging. sad.",
    "lock-in status: 12%. we need to pump those numbers up. put the phone down.",
    "that's a +50 aura play right there. cypher approves.",
    "low aura detected. initiating tactical roast protocol. just kidding. or am i?",
    "your syntax is giving 'i learned to code from a cereal box'. fix it."
];

function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

window.addEventListener('resize', resize);
resize();

// Waveform animation logic
let time = 0;
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const centerY = canvas.height / 2;
    
    for (let x = 0; x < canvas.width; x++) {
        const amplitude = 30 + Math.sin(time * 0.05) * 10;
        const frequency = 0.01;
        const y = centerY + Math.sin(x * frequency + time) * amplitude * Math.sin(time * 0.3);
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    
    ctx.stroke();
    
    // Add some "digital grain"
    for (let i = 0; i < 10; i++) {
        const rx = Math.random() * canvas.width;
        const ry = Math.random() * canvas.height;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.fillRect(rx, ry, 2, 2);
    }
    
    time += 0.05;
    requestAnimationFrame(animate);
}

animate();

// Terminal logic
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
        const val = input.value;
        input.value = '';
        
        // Add user message
        const userLine = document.createElement('div');
        userLine.className = 'line';
        userLine.innerHTML = `<span class="user-tag">xavier:</span> <span class="user-msg">${val}</span>`;
        output.appendChild(userLine);
        
        // Response after delay
        setTimeout(() => {
            const cypherLine = document.createElement('div');
            cypherLine.className = 'line';
            const response = cypherResponses[Math.floor(Math.random() * cypherResponses.length)];
            cypherLine.innerHTML = `<span class="bot">cypher:</span> ${response}`;
            output.appendChild(cypherLine);
            output.scrollTop = output.scrollHeight;
            
            // Interaction effect on canvas
            time += 5; 
        }, 400);
        
        output.scrollTop = output.scrollHeight;
    }
});

// Focus input on click anywhere in terminal
document.getElementById('terminal').addEventListener('click', () => {
    input.focus();
});