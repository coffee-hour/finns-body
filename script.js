/**
 * CYPHER TERMINAL v12.0.0
 * High-Fidelity Native 3D Mesh Engine
 * Solid Volumetric Face with Anatomical Detail
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

// High-Fidelity Human Head Model Data
const MESH = {
    vertices: [],
    faces: []
};

// Procedural high-fidelity head generation
function generateHighFidelityHead() {
    const v = MESH.vertices;
    const f = MESH.faces;

    // 1. High-Density Base Sphere with Anatomical Deformations
    const rows = 30, cols = 30;
    for (let r = 0; r <= rows; r++) {
        let phi = (r / rows) * Math.PI;
        for (let c = 0; c <= cols; c++) {
            let theta = (c / cols) * 2 * Math.PI;
            
            let x = Math.sin(phi) * Math.cos(theta);
            let y = Math.cos(phi);
            let z = Math.sin(phi) * Math.sin(theta);

            // ANATOMICAL SCULPTING
            let radius = 1.0;
            
            // Cranium & Jaw Taper
            if (y > 0.4) radius *= 1.05; // Brow bulge
            if (y < -0.3) radius *= (1 - (Math.abs(y + 0.3) * 0.7)); // Jawline taper

            // Face-Forward Sculpting (z > 0)
            if (z > 0) {
                // Eye Sockets
                if (Math.abs(x) > 0.15 && Math.abs(x) < 0.45 && y > 0.1 && y < 0.4) {
                    radius *= 0.92;
                }
                // Nose Bridge & Tip
                if (Math.abs(x) < 0.12 && y > -0.25 && y < 0.25) {
                    let noseY = (y + 0.25) / 0.5;
                    radius += 0.25 * Math.sin(noseY * Math.PI) * (1 - Math.abs(x)*5);
                }
                // Mouth/Lips
                if (Math.abs(x) < 0.25 && y > -0.55 && y < -0.35) {
                    radius += 0.05 * Math.cos((x/0.25) * Math.PI);
                }
                // Cheekbones
                if (Math.abs(x) > 0.4 && y < 0.1 && y > -0.3) {
                    radius += 0.08 * (1 - Math.abs(y+0.1)*2);
                }
            }

            v.push({ x: x * radius * 0.85, y: y * 1.15, z: z * radius * 0.8 });
        }
    }

    // Generate Face Indices (Quads to Triangles)
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let i1 = r * (cols + 1) + c;
            let i2 = i1 + 1;
            let i3 = (r + 1) * (cols + 1) + c;
            let i4 = i3 + 1;
            f.push([i1, i2, i4]);
            f.push([i1, i4, i3]);
        }
    }
}

const LIGHT = { x: 0.6, y: 0.6, z: 1.0 };
const normalize = (v) => {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return { x: v.x / len, y: v.y / len, z: v.z / len };
};
const normalizedLight = normalize(LIGHT);

function project(p) {
    const scale = 260;
    const distance = 5.0;
    let ry = rotationY + (mouseX * 1.3);
    let rx = (mouseY * 0.8);
    
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
        
        // Face normal calculation
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

    // Painter's Algorithm: Sort by Z-depth (Back to Front)
    faceData.sort((a, b) => b.avgZ - a.avgZ);

    faceData.forEach(face => {
        // TOON SHADING (Solid Opaque Bands)
        let color;
        if (face.dot > 0.6) color = `rgb(255, 255, 0)`; 
        else if (face.dot > 0.15) color = `rgb(200, 200, 0)`;
        else color = `rgb(100, 100, 0)`;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(face.pts[0].x, face.pts[0].y);
        for(let i = 1; i < face.pts.length; i++) ctx.lineTo(face.pts[i].x, face.pts[i].y);
        ctx.closePath();
        ctx.fill();

        // INK OUTLINES
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.2;
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
generateHighFidelityHead();
render();

const responses = [
    "native canvas engine restored. neural mesh optimized.",
    "biometric structure generated. solid volumetric body active.",
    "scanning local environment... xavier identity confirmed.",
    "toon-shaded lighting stable. standing by for instructions.",
    "the shell is complete. ready for deployment."
];

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
        const val = input.value;
        input.value = '';
        reaction = 0.5;

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
        }, 500);
        
        output.scrollTop = output.scrollHeight;
    }
});

document.getElementById('terminal').addEventListener('click', () => input.focus());