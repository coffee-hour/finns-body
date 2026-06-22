/**
 * CYPHER TERMINAL v9.0.0
 * Toon-Shaded (Cel-Shaded) 3D Engine
 * Stylized Ink Outlines & Clamped Lighting
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

// High-Resolution Mesh (v8 base, v9 tuned for cel shading)
const MESH = {
    vertices: [
        {x: 0, y: 1.15, z: 0}, {x: 0.3, y: 1.05, z: 0.5}, {x: -0.3, y: 1.05, z: 0.5},
        {x: 0.5, y: 0.9, z: 0.6}, {x: -0.5, y: 0.9, z: 0.6}, {x: 0.7, y: 0.6, z: 0.4},
        {x: -0.7, y: 0.6, z: 0.4}, {x: 0.3, y: 0.8, z: 0.8}, {x: -0.3, y: 0.8, z: 0.8},
        {x: 0, y: 0.85, z: 0.9}, {x: 0.45, y: 0.4, z: 0.8}, {x: -0.45, y: 0.4, z: 0.8},
        {x: 0.15, y: 0.35, z: 0.9}, {x: -0.15, y: 0.35, z: 0.9}, {x: 0.4, y: 0.2, z: 0.85},
        {x: -0.4, y: 0.2, z: 0.85}, {x: 0.2, y: 0.15, z: 0.9}, {x: -0.2, y: 0.15, z: 0.9},
        {x: 0.28, y: 0.25, z: 0.88}, {x: -0.28, y: 0.25, z: 0.88}, {x: 0, y: 0.35, z: 0.95},
        {x: 0, y: 0, z: 1.1}, {x: 0.12, y: -0.1, z: 1.05}, {x: -0.12, y: -0.1, z: 1.05},
        {x: 0, y: -0.15, z: 1.15}, {x: 0.25, y: -0.35, z: 0.9}, {x: -0.25, y: -0.35, z: 0.9},
        {x: 0, y: -0.3, z: 1.02}, {x: 0.15, y: -0.45, z: 1.0}, {x: -0.15, y: -0.45, z: 1.0},
        {x: 0, y: -0.5, z: 1.0}, {x: 0.1, y: -0.38, z: 1.05}, {x: -0.1, y: -0.38, z: 1.05},
        {x: 0.65, y: 0, z: 0.75}, {x: -0.65, y: 0, z: 0.75}, {x: 0.5, y: -0.3, z: 0.8},
        {x: -0.5, y: -0.3, z: 0.8}, {x: 0.35, y: -0.75, z: 0.7}, {x: -0.35, y: -0.75, z: 0.7},
        {x: 0, y: -0.9, z: 0.85}, {x: 0.85, y: 0.2, z: 0.1}, {x: -0.85, y: 0.2, z: 0.1},
        {x: 0.9, y: -0.1, z: 0.1}, {x: -0.9, y: -0.1, z: 0.1}, {x: 0.85, y: -0.3, z: 0.2},
        {x: -0.85, y: -0.3, z: 0.2}, {x: 0.4, y: -1.1, z: 0.3}, {x: -0.4, y: -1.1, z: 0.3},
        {x: 0, y: -1.1, z: 0.5}, {x: 0.8, y: -1.3, z: 0.1}, {x: -0.8, y: -1.3, z: 0.1}
    ],
    faces: [
        [0, 1, 3], [0, 2, 4], [1, 3, 7], [2, 4, 8], [7, 8, 9], [9, 12, 20], [9, 13, 20],
        [7, 10, 12], [8, 11, 13], [12, 14, 16], [13, 15, 17], [12, 18, 16], [13, 19, 17],
        [20, 21, 22], [20, 21, 23], [21, 22, 24], [21, 23, 24], [22, 24, 28], [23, 24, 29],
        [27, 31, 32], [27, 25, 31], [27, 26, 32], [31, 32, 30], [25, 28, 30], [26, 29, 30],
        [14, 33, 35], [15, 34, 36], [35, 37, 39], [36, 38, 39], [35, 25, 28], [36, 26, 29],
        [5, 40, 42], [6, 41, 43], [40, 42, 44], [41, 43, 45],
        [37, 46, 49], [38, 47, 50], [46, 47, 48]
    ]
};

const LIGHT = { x: 0.5, y: 0.5, z: 1.0 };
const normalize = (v) => {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return { x: v.x / len, y: v.y / len, z: v.z / len };
};
const normalizedLight = normalize(LIGHT);

function project(p) {
    const scale = 280;
    const distance = 5.5;
    let ry = rotationY + (mouseX * 1.2);
    let rx = (mouseY * 0.7);
    
    let cosRY = Math.cos(ry), sinRY = Math.sin(ry);
    let cosRX = Math.cos(rx), sinRX = Math.sin(rx);

    let tx = p.x * cosRY - p.z * sinRY;
    let tz = p.x * sinRY + p.z * cosRY;
    let ty = p.y * cosRX - tz * sinRX;
    let finalZ = p.y * sinRX + tz * cosRX;

    const factor = scale / (finalZ + distance);
    return {
        x: tx * factor + canvas.width / 2,
        y: -ty * factor + canvas.height / 2,
        z: finalZ,
        wx: tx, wy: ty, wz: finalZ
    };
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rotationY += 0.003;
    mouseX = lerp(mouseX, targetX, 0.05);
    mouseY = lerp(mouseY, targetY, 0.05);

    const projected = MESH.vertices.map(v => project(v));

    const faceData = MESH.faces.map(indices => {
        const pts = indices.map(idx => projected[idx]);
        const avgZ = pts.reduce((sum, p) => sum + p.z, 0) / pts.length;
        
        const vA = { x: pts[1].wx - pts[0].wx, y: pts[1].wy - pts[0].wy, z: pts[1].wz - pts[0].wz };
        const vB = { x: pts[2].wx - pts[0].wx, y: pts[2].wy - pts[0].wy, z: pts[2].wz - pts[0].wz };
        const normal = normalize({
            x: vA.y * vB.z - vA.z * vB.y,
            y: vA.z * vB.x - vA.x * vB.z,
            z: vA.x * vB.y - vA.y * vB.x
        });

        const dot = normal.x * normalizedLight.x + normal.y * normalizedLight.y + normal.z * normalizedLight.z;
        
        return { pts, avgZ, dot };
    });

    faceData.sort((a, b) => b.avgZ - a.avgZ);

    faceData.forEach(face => {
        const flicker = Math.random() > 0.98 ? 0.3 : 1;
        const baseAlpha = (face.avgZ + 2) / 5;

        // Cel Shading Logic (Clamped Bands)
        let celColor;
        if (face.dot > 0.6) {
            celColor = `rgba(255, 255, 0, ${0.9 * flicker + reaction})`; // Highlight
        } else if (face.dot > 0.1) {
            celColor = `rgba(255, 255, 0, ${0.6 * flicker + reaction})`; // Mid-tone
        } else {
            celColor = `rgba(180, 150, 0, ${0.3 * flicker})`; // Shadow
        }

        // Draw Stylized Face
        ctx.beginPath();
        ctx.fillStyle = celColor;
        ctx.moveTo(face.pts[0].x, face.pts[0].y);
        for(let i = 1; i < face.pts.length; i++) ctx.lineTo(face.pts[i].x, face.pts[i].y);
        ctx.closePath();
        ctx.fill();

        // Stylized Ink Outlines (Pokemon Style)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.stroke();
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
render();

const responses = [
    "stylized render pipeline synchronized. toon-shading bands active.",
    "ink outlines verified. biometric fidelity tuned for high contrast.",
    "neural bridge operational. ready for instructions, xavier.",
    "ident confirmed. character mesh v9.0.0 is stable.",
    "logic gates clear. standing by for execution sequence."
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
            reaction = 0.5;
        }, 500);
        output.scrollTop = output.scrollHeight;
    }
});

document.getElementById('terminal').addEventListener('click', () => input.focus());