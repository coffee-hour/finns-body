/**
 * CYPHER TERMINAL v7.0.0
 * High-Fidelity 3D Mesh Engine (Vanilla JS)
 * Wireframe Topology with Depth-Sorting
 */

const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const input = document.getElementById('user-input');

let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let reaction = 0;
let rotationY = 0;

const lerp = (a, b, n) => (1 - n) * a + n * b;

// Low-poly human head mesh data (Vertices & Faces)
const MESH = {
    vertices: [
        // Cranium
        {x: 0, y: 1.1, z: 0}, {x: 0.4, y: 1.0, z: 0.4}, {x: -0.4, y: 1.0, z: 0.4},
        {x: 0.4, y: 1.0, z: -0.4}, {x: -0.4, y: 1.0, z: -0.4}, {x: 0.7, y: 0.6, z: 0.5},
        {x: -0.7, y: 0.6, z: 0.5}, {x: 0.7, y: 0.6, z: -0.5}, {x: -0.7, y: 0.6, z: -0.5},
        // Forehead
        {x: 0.3, y: 0.7, z: 0.8}, {x: -0.3, y: 0.7, z: 0.8}, {x: 0, y: 0.7, z: 0.9},
        // Eyes/Brows
        {x: 0.4, y: 0.3, z: 0.85}, {x: -0.4, y: 0.3, z: 0.85}, {x: 0.15, y: 0.25, z: 0.9},
        {x: -0.15, y: 0.25, z: 0.9}, {x: 0.3, y: 0.15, z: 0.95}, {x: -0.3, y: 0.15, z: 0.95},
        // Nose
        {x: 0, y: 0.2, z: 1.0}, {x: 0, y: -0.1, z: 1.15}, {x: 0.1, y: -0.2, z: 1.05},
        {x: -0.1, y: -0.2, z: 1.05},
        // Cheeks
        {x: 0.6, y: -0.1, z: 0.7}, {x: -0.6, y: -0.1, z: 0.7}, {x: 0.4, y: -0.3, z: 0.85},
        {x: -0.4, y: -0.3, z: 0.85},
        // Mouth
        {x: 0.2, y: -0.45, z: 0.9}, {x: -0.2, y: -0.45, z: 0.9}, {x: 0, y: -0.4, z: 1.0},
        {x: 0, y: -0.55, z: 0.95},
        // Jaw/Chin
        {x: 0.3, y: -0.8, z: 0.6}, {x: -0.3, y: -0.8, z: 0.6}, {x: 0, y: -0.9, z: 0.8},
        // Ears/Sides
        {x: 0.85, y: 0.1, z: 0}, {x: -0.85, y: 0.1, z: 0}, {x: 0.85, y: -0.2, z: 0},
        {x: -0.85, y: -0.2, z: 0},
        // Neck
        {x: 0.3, y: -1.2, z: 0.2}, {x: -0.3, y: -1.2, z: 0.2}, {x: 0, y: -1.2, z: 0.4}
    ],
    faces: [
        // Forehead/Cranium connections
        [0, 1, 3], [0, 2, 4], [1, 9, 11], [2, 10, 11], [1, 5, 9], [2, 6, 10],
        // Eyes/Bridge
        [11, 14, 18], [11, 15, 18], [9, 12, 14], [10, 13, 15], [14, 16, 18], [15, 17, 18],
        // Nose
        [18, 19, 20], [18, 19, 21], [19, 20, 28], [19, 21, 28],
        // Cheeks/Mouth
        [12, 22, 24], [13, 23, 25], [24, 26, 28], [25, 27, 28], [26, 28, 29], [27, 28, 29],
        // Jaw/Chin
        [24, 30, 32], [25, 31, 32], [26, 30, 29], [27, 31, 29], [30, 32, 29], [31, 32, 29],
        // Sides/Back
        [5, 22, 33], [6, 23, 34], [33, 35, 30], [34, 36, 31],
        // Neck
        [30, 37, 39], [31, 38, 39]
    ]
};

function project(p) {
    const scale = 250;
    const distance = 5;
    
    let x = p.x;
    let y = p.y;
    let z = p.z;

    // Interaction Rotations
    let ry = rotationY + (mouseX * 1.0);
    let rx = (mouseY * 0.6);
    
    // Y-Axis
    let cosRY = Math.cos(ry), sinRY = Math.sin(ry);
    let tx = x * cosRY - z * sinRY;
    let tz = x * sinRY + z * cosRY;
    
    // X-Axis
    let cosRX = Math.cos(rx), sinRX = Math.sin(rx);
    let ty = y * cosRX - tz * sinRX;
    tz = y * sinRX + tz * cosRX;

    const factor = scale / (tz + distance);
    return {
        x: tx * factor + canvas.width / 2,
        y: -ty * factor + canvas.height / 2,
        z: tz
    };
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rotationY += 0.005;
    mouseX = lerp(mouseX, targetX, 0.05);
    mouseY = lerp(mouseY, targetY, 0.05);

    // 1. Project all vertices
    const projected = MESH.vertices.map(v => project(v));

    // 2. Prepare Faces for depth sorting
    const faceData = MESH.faces.map(faceIndices => {
        const points = faceIndices.map(idx => projected[idx]);
        // Simple depth average for Painter's Algorithm
        const avgZ = points.reduce((sum, p) => sum + p.z, 0) / points.length;
        return { points, avgZ };
    });

    // 3. Sort by Depth (Back to Front)
    faceData.sort((a, b) => b.avgZ - a.avgZ);

    // 4. Render Faces
    faceData.forEach(face => {
        const flicker = Math.random() > 0.98 ? 0.5 : 1;
        // Distance-based alpha
        let depthAlpha = (face.avgZ + 2) / 4; 
        let alpha = Math.max(0.1, depthAlpha * 0.6) * flicker + (reaction * 0.4);

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.lineWidth = 0.8;
        
        // Move to first point
        ctx.moveTo(face.points[0].x, face.points[0].y);
        for(let i = 1; i < face.points.length; i++) {
            ctx.lineTo(face.points[i].x, face.points[i].y);
        }
        ctx.closePath();
        
        // Optional: subtle fill to enhance "solid" feel
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.05})`;
        ctx.fill();
        ctx.stroke();

        // Render vertices as glowing nodes
        face.points.forEach(p => {
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 1.5})`;
            ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        });
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
render();

// Terminal Chat logic
const responses = [
    "mesh integrity verified. topology is optimized.",
    "holographic projection stable. scanning for input sequences.",
    "neural link established. awaiting your next command, xavier.",
    "system diagnostics: 100% nominal. ready for deployment.",
    "compiling request through biometric nodes... sequence valid.",
    "the shell is active. ready to build the future."
];

input.addEventListener('keydown', (e) => {
    reaction = 0.2;
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
            reaction = 1.0;
        }, 500);
        output.scrollTop = output.scrollHeight;
    }
});

document.getElementById('terminal').addEventListener('click', () => input.focus());