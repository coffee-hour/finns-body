/**
 * CYPHER TERMINAL v4.0.0
 * Pure Vanilla JS 3D Projection System
 * Interactive Humanoid Hologram
 */

const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const input = document.getElementById('user-input');

// Interaction State
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let reaction = 0;

// 3D Matrix Parameters
const points = [];
const numPoints = 600;
const rotationSpeed = 0.005;
let rotationY = 0;
let rotationX = 0;

// Generate 3D Humanoid Point Cloud (Stylized Bust)
function initPoints() {
    for (let i = 0; i < numPoints; i++) {
        // Head
        let u = Math.random();
        let v = Math.random();
        let theta = 2 * Math.PI * u;
        let phi = Math.acos(2 * v - 1);
        
        let x = Math.sin(phi) * Math.cos(theta);
        let y = Math.cos(phi);
        let z = Math.sin(phi) * Math.sin(theta);
        
        // Elongate and shape into a head
        y *= 1.2;
        x *= 0.8;
        z *= 0.8;
        
        // Shoulder/Neck structure
        if (Math.random() > 0.7) {
            y -= 1.5;
            x *= 2.5;
            z *= 0.5;
        }

        points.push({ x, y, z });
    }
}

function project(p) {
    const scale = 180;
    const distance = 4;
    
    // Rotation logic
    let x = p.x;
    let y = p.y;
    let z = p.z;

    // Y-Axis Rotation (Automatic + Mouse)
    let ry = rotationY + (mouseX * 0.5);
    let cosRY = Math.cos(ry);
    let sinRY = Math.sin(ry);
    let tempX = x * cosRY - z * sinRY;
    let tempZ = x * sinRY + z * cosRY;
    x = tempX;
    z = tempZ;

    // X-Axis Rotation (Mouse)
    let rx = rotationX + (mouseY * 0.3);
    let cosRX = Math.cos(rx);
    let sinRX = Math.sin(rx);
    let tempY = y * cosRX - z * sinRX;
    tempZ = y * sinRX + z * cosRX;
    y = tempY;
    z = tempZ;

    // Perspective Projection
    const factor = scale / (z + distance);
    return {
        x: x * factor + canvas.width / 2,
        y: -y * factor + canvas.height / 2,
        alpha: (z + 1.5) / 3 // Depth-based alpha
    };
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    rotationY += rotationSpeed;
    
    // Smoothing mouse tracking
    mouseX += (targetX - mouseX) * 0.05;
    mouseY += (targetY - mouseY) * 0.05;

    points.forEach((p, i) => {
        const proj = project(p);
        
        // Pulse during transmission
        const flicker = Math.random() > 0.98 ? 0.2 : 1;
        const baseAlpha = Math.max(0.1, proj.alpha) * flicker;
        const finalAlpha = baseAlpha + (reaction * Math.random());

        ctx.fillStyle = `rgba(255, 255, 0, ${finalAlpha})`;
        
        // Render nodes
        const size = (proj.alpha * 2) + (reaction * 2);
        ctx.fillRect(proj.x, proj.y, size, size);

        // Subtile vector connections
        if (i % 15 === 0 && points[i+1]) {
            const nextProj = project(points[i+1]);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 0, ${finalAlpha * 0.2})`;
            ctx.moveTo(proj.x, proj.y);
            ctx.lineTo(nextProj.x, nextProj.y);
            ctx.stroke();
        }
    });

    if (reaction > 0) reaction *= 0.96;
    requestAnimationFrame(render);
}

// Interaction Handlers
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / canvas.width) - 0.5;
    targetY = ((e.clientY - rect.top) / canvas.height) - 0.5;
});

function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

window.addEventListener('resize', resize);
resize();
initPoints();
render();

// Terminal Chat Simulation (Clean/Tech-focused)
const responses = [
    "neural bridge synchronized. compiling latest commit architecture.",
    "analysis complete: your recent logic optimization reduced latency by 14%.",
    "i've mapped the deployment path. waiting for your signature to execute.",
    "scanning local environment... firewall integrity at 100%. we're secure.",
    "that implementation is elegant. it scales well across the current stack.",
    "standing by for the next sequence. the hologram is tracking your focus.",
    "memory buffers cleared. ready to process the next high-level instruction.",
    "detecting peak cognitive load. system performance is peaking with you."
];

input.addEventListener('keydown', (e) => {
    reaction = 0.5; // Visual feedback on type
    
    if (e.key === 'Enter' && input.value.trim() !== '') {
        const val = input.value;
        input.value = '';
        
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
            reaction = 1.5; // Transmission pulse
        }, 600);
        
        output.scrollTop = output.scrollHeight;
    }
});

document.getElementById('terminal').addEventListener('click', () => input.focus());