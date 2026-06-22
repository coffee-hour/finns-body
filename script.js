/**
 * CYPHER TERMINAL v6.0.0
 * Organic Volumetric 3D Face Projection
 * High-Density Point Cloud & Depth Sorting
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

// Helper: Linear Interpolation for fluid motion
const lerp = (a, b, n) => (1 - n) * a + n * b;

function initHighFidelityFace() {
    // 1. Base Cranium (High Density)
    for(let i=0; i<800; i++) {
        let u = Math.random();
        let v = Math.random();
        let theta = 2 * Math.PI * u;
        let phi = Math.acos(2 * v - 1);
        let r = 0.85;
        let x = Math.sin(phi) * Math.cos(theta) * r;
        let y = Math.cos(phi) * 1.1;
        let z = Math.sin(phi) * Math.sin(theta) * r * 0.9;
        
        // Taper for jaw and chin
        if (y < -0.2) {
            let taper = 1 - (Math.abs(y + 0.2) * 0.6);
            x *= taper;
            z *= taper;
        }
        points.push({x, y, z, type: 'skin'});
    }

    // 2. Eyes & Detailed Eyelids
    for(let side of [-1, 1]) {
        for(let i=0; i<100; i++) {
            let t = (i / 100) * Math.PI;
            // Eyelid curves
            let ex = (0.28 * side) + Math.cos(t) * 0.12;
            let ey = 0.22 + Math.sin(t) * 0.05 * (i % 2 === 0 ? 1 : -0.5);
            points.push({x: ex, y: ey, z: 0.72, type: 'feature'});
            // Eyeball surface
            if (i < 40) {
                points.push({
                    x: (0.28 * side) + (Math.random()-0.5)*0.1, 
                    y: 0.22 + (Math.random()-0.5)*0.08, 
                    z: 0.75, 
                    type: 'eye'
                });
            }
        }
    }

    // 3. Nose Structure (Bridge + Nostrils)
    for(let i=0; i<150; i++) {
        let ty = (i / 150) * 0.5 - 0.25; // y from 0.25 down to -0.25
        let bridgeWidth = 0.03 + (ty < -0.1 ? Math.abs(ty+0.1)*0.4 : 0);
        let x = (Math.random()-0.5) * bridgeWidth;
        let z = 0.7 + (ty < 0 ? Math.abs(ty)*0.8 : 0);
        points.push({x, y: -ty, z, type: 'feature'});
        // Nostril flares
        if (i > 120) {
            points.push({x: bridgeWidth*2, y: -ty, z: z-0.05, type: 'feature'});
            points.push({x: -bridgeWidth*2, y: -ty, z: z-0.05, type: 'feature'});
        }
    }

    // 4. Defined Lips
    for(let i=0; i<120; i++) {
        let t = (i / 120) * Math.PI * 2;
        let lx = Math.cos(t) * 0.18;
        let ly = -0.42 + Math.sin(t) * 0.06 * (Math.sin(t) > 0 ? 1 : 0.6);
        points.push({x: lx, y: ly, z: 0.75 + Math.abs(lx)*0.2, type: 'feature'});
    }

    // 5. Cheekbones & Jawline
    for(let i=0; i<200; i++) {
        let t = (i / 200) * 2 - 1; // -1 to 1
        let x = t * 0.8;
        let y = -0.1 - (Math.abs(t) * 0.4);
        points.push({x, y, z: 0.6 + (Math.abs(t)*0.3), type: 'skin'}); // Cheekbones
        
        let jx = t * 0.5;
        let jy = -0.9 + (Math.abs(t)*0.3);
        points.push({x: jx, y: jy, z: 0.5 - (Math.abs(t)*0.4), type: 'feature'}); // Jaw
    }

    // 6. Ears
    for(let side of [-1, 1]) {
        for(let i=0; i<60; i++) {
            let u = Math.random() * Math.PI;
            points.push({
                x: (0.85 * side) + Math.sin(u) * 0.15 * side,
                y: 0.1 + Math.cos(u) * 0.25,
                z: -0.1,
                type: 'skin'
            });
        }
    }

    // 7. Neck Support
    for(let i=0; i<150; i++) {
        let ty = -1.0 - Math.random() * 0.5;
        let rad = 0.4;
        let ang = Math.random() * Math.PI * 2;
        points.push({
            x: Math.cos(ang) * rad,
            y: ty,
            z: Math.sin(ang) * rad * 0.8,
            type: 'skin'
        });
    }
}

function project(p) {
    const scale = 260;
    const distance = 4.5;
    
    let x = p.x;
    let y = p.y;
    let z = p.z;

    // Fluid Gaze/Rotation Lerp
    let ry = rotationY + (mouseX * 0.8);
    let cosRY = Math.cos(ry);
    let sinRY = Math.sin(ry);
    let rx = (mouseY * 0.5);
    let cosRX = Math.cos(rx);
    let sinRX = Math.sin(rx);

    // Transforms
    let tx = x * cosRY - z * sinRY;
    let tz = x * sinRY + z * cosRY;
    let ty = y * cosRX - tz * sinRX;
    tz = y * sinRX + tz * cosRX;

    const factor = scale / (tz + distance);
    return {
        x: tx * factor + canvas.width / 2,
        y: -ty * factor + canvas.height / 2,
        z: tz, // For depth sorting
        type: p.type
    };
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rotationY += 0.003;
    
    // Smooth input tracking
    mouseX = lerp(mouseX, targetX, 0.05);
    mouseY = lerp(mouseY, targetY, 0.05);

    // Depth Sorting (Painter's Algorithm)
    // Points with higher Z (closer to screen) are rendered last
    const projected = points.map(p => project(p));
    projected.sort((a, b) => b.z - a.z);

    projected.forEach((p) => {
        const flicker = Math.random() > 0.98 ? 0.4 : 1;
        
        // Depth-based lighting/sizing
        // tz ranges roughly from -1 to 1.5. map to alpha/size
        let depthFactor = (p.z + 2) / 4; // 0 to 1
        let size = (depthFactor * 2.2) + (reaction * 3);
        let alpha = Math.max(0.05, depthFactor * 0.8) * flicker + (reaction * 0.5);

        if(p.type === 'feature') {
            size += 0.8;
            alpha = Math.min(1, alpha + 0.2);
        }

        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.fillRect(p.x, p.y, size, size);
    });

    if (reaction > 0) reaction *= 0.95;
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
initHighFidelityFace();
render();

// Terminal logic remains clean and professional
const responses = [
    "encryption handshake verified. uplink is secure.",
    "volumetric data stream synchronized. biometric fidelity at maximum.",
    "kernel optimization complete. resource allocation is efficient.",
    "standing by for system instructions. neural bridge is stable.",
    "local environment scan complete. zero intrusions detected.",
    "identity verified: xavier. full terminal access granted.",
    "processing request through secondary neural nodes...",
    "holographic gain adjusted. biometric resolution optimized."
];

input.addEventListener('keydown', (e) => {
    reaction = 0.3;
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
        }, 500);
        output.scrollTop = output.scrollHeight;
    }
});

document.getElementById('terminal').addEventListener('click', () => input.focus());