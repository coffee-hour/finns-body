/**
 * CYPHER TERMINAL v5.0.0
 * Advanced 3D Face-Mesh Projection System
 * Vanilla JavaScript High-Fidelity Cybernetic Face
 */

const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const input = document.getElementById('user-input');

let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let reaction = 0;
let rotationY = 0;
const points = [];

// Generate high-detail facial geometry points
function initFaceGeometry() {
    // Basic Head Shape
    for(let i=0; i<400; i++) {
        let u = Math.random();
        let v = Math.random();
        let theta = 2 * Math.PI * u;
        let phi = Math.acos(2 * v - 1);
        let x = Math.sin(phi) * Math.cos(theta) * 0.8;
        let y = Math.cos(phi) * 1.1;
        let z = Math.sin(phi) * Math.sin(theta) * 0.7;
        if(y < -0.6) x *= 0.5; // Taper jaw
        points.push({x, y, z, type: 'head'});
    }

    // Eyes
    for(let side of [-1, 1]) {
        for(let i=0; i<30; i++) {
            let r = Math.random() * 0.08;
            let ang = Math.random() * Math.PI * 2;
            points.push({
                x: (0.25 * side) + Math.cos(ang)*r,
                y: 0.2 + Math.sin(ang)*r,
                z: 0.6,
                type: 'eye'
            });
        }
    }

    // Nose Bridge & Tip
    for(let i=0; i<40; i++) {
        let ty = (Math.random() * 0.4) - 0.2;
        points.push({
            x: (Math.random()-0.5) * 0.05,
            y: ty,
            z: 0.65 + (ty < 0 ? -ty*0.2 : 0),
            type: 'nose'
        });
    }

    // Mouth Line
    for(let i=0; i<50; i++) {
        let tx = (Math.random() - 0.5) * 0.3;
        points.push({
            x: tx,
            y: -0.35 + (tx*tx*0.2),
            z: 0.6,
            type: 'mouth'
        });
    }

    // Jawline Definition
    for(let i=0; i<60; i++) {
        let t = (Math.random() - 0.5) * 2;
        points.push({
            x: t * 0.6,
            y: -0.8 + (Math.abs(t)*0.2),
            z: 0.5 - (Math.abs(t)*0.3),
            type: 'jaw'
        });
    }
}

function project(p) {
    const scale = 220;
    const distance = 4;
    
    let x = p.x;
    let y = p.y;
    let z = p.z;

    // Head tracking / Rotation
    let ry = rotationY + (mouseX * 0.6);
    let cosRY = Math.cos(ry);
    let sinRY = Math.sin(ry);
    let rx = (mouseY * 0.4);
    let cosRX = Math.cos(rx);
    let sinRX = Math.sin(rx);

    // Y Rotate
    let tx = x * cosRY - z * sinRY;
    let tz = x * sinRY + z * cosRY;
    // X Rotate
    let ty = y * cosRX - tz * sinRX;
    tz = y * sinRX + tz * cosRX;

    const factor = scale / (tz + distance);
    return {
        x: tx * factor + canvas.width / 2,
        y: -ty * factor + canvas.height / 2,
        z: tz,
        alpha: (tz + 1.5) / 3,
        type: p.type
    };
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rotationY += 0.004;
    mouseX += (targetX - mouseX) * 0.06;
    mouseY += (targetY - mouseY) * 0.06;

    const projected = points.map(p => project(p));

    projected.forEach((p, i) => {
        const flicker = Math.random() > 0.97 ? 0.3 : 1;
        let size = (p.alpha * 1.8) + (reaction * 2.5);
        let alpha = Math.max(0.1, p.alpha) * flicker + (reaction * 0.4);

        if(p.type !== 'head') {
            size += 0.5;
            alpha += 0.2;
        }

        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.fillRect(p.x, p.y, size, size);

        // Render features with connecting lines
        if (i % 12 === 0 && points[i+1] && points[i].type === points[i+1].type) {
            const next = project(points[i+1]);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 0, ${alpha * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
        }
    });

    if (reaction > 0) reaction *= 0.94;
    requestAnimationFrame(render);
}

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
initFaceGeometry();
render();

const responses = [
    "encryption protocols verified. the network is silent.",
    "facial mesh calibrated. eye-tracking synchronized.",
    "analyzing the latest kernel update. efficiency gains are significant.",
    "neural pathways are clear. standing by for complex instructions.",
    "biometric scan complete. identity confirmed: xavier.",
    "holographic flicker detected. adjusting output gain to compensate.",
    "processing input stream... logic sequence validated.",
    "all systems nominal. the digital body is ready for deployment."
];

input.addEventListener('keydown', (e) => {
    reaction = 0.4;
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
            reaction = 1.2;
        }, 550);
        output.scrollTop = output.scrollHeight;
    }
});

document.getElementById('terminal').addEventListener('click', () => input.focus());