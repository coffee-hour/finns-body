/**
 * CYPHER TERMINAL v14.0.0
 * Refined Cyber-Skull Engine with Corrected Topology
 * Solid Volumetric Toon-Shaded Mesh
 */

const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const input = document.getElementById('user-input');

let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
let reaction = 0, rotationY = 0, frame = 0;

const lerp = (a, b, n) => (1 - n) * a + n * b;

const MESH = { vertices: [], faces: [] };

function initCyberSkull() {
    const v = MESH.vertices;
    const f = MESH.faces;

    // 1. REFINED CYBER-SKULL GEOMETRY
    // Cranium (Top)
    v.push({x:0, y:1.1, z:0}); // 0: Top center
    v.push({x:0.5, y:0.8, z:0.5}, {x:-0.5, y:0.8, z:0.5}); // 1, 2: Front top sides
    v.push({x:0.5, y:0.8, z:-0.5}, {x:-0.5, y:0.8, z:-0.5}); // 3, 4: Back top sides
    
    // Brow Ridge
    v.push({x:0.4, y:0.4, z:0.7}, {x:-0.4, y:0.4, z:0.7}); // 5, 6: Brow outer
    v.push({x:0, y:0.45, z:0.8}); // 7: Brow center
    
    // Eye Sockets (Deep)
    v.push({x:0.25, y:0.2, z:0.6}, {x:-0.25, y:0.2, z:0.6}); // 8, 9: Inner sockets
    v.push({x:0.35, y:0.2, z:0.8}, {x:-0.35, y:0.2, z:0.8}); // 10, 11: Outer sockets
    
    // Nasal Gap
    v.push({x:0, y:0, z:0.9}); // 12: Nose bridge
    v.push({x:0.1, y:-0.15, z:0.85}, {x:-0.1, y:-0.15, z:0.85}); // 13, 14: Nostrils
    
    // Cheekbones
    v.push({x:0.7, y:0.1, z:0.4}, {x:-0.7, y:0.1, z:0.4}); // 15, 16
    v.push({x:0.6, y:-0.2, z:0.6}, {x:-0.6, y:-0.2, z:0.6}); // 17, 18
    
    // Jaw/Teeth Area
    v.push({x:0.3, y:-0.6, z:0.5}, {x:-0.3, y:-0.6, z:0.5}); // 19, 20: Jaw hinge
    v.push({x:0.2, y:-0.8, z:0.7}, {x:-0.2, y:-0.8, z:0.7}); // 21, 22: Chin sides
    v.push({x:0, y:-0.85, z:0.75}); // 23: Chin tip

    // Skull Faces (Clockwise/Counter-clockwise consistency)
    f.push([0, 1, 2], [0, 2, 4], [0, 4, 3], [0, 3, 1]); // Cranium Cap
    f.push([1, 2, 7], [1, 7, 5], [2, 6, 7]); // Forehead
    f.push([5, 10, 8], [6, 9, 11], [7, 8, 10], [7, 11, 9]); // Eye Sockets
    f.push([10, 17, 13], [11, 14, 18], [12, 13, 14]); // Mid-face/Nose
    f.push([17, 19, 21], [18, 22, 20], [21, 23, 22]); // Jawline
    f.push([13, 21, 23], [14, 23, 22]); // Teeth/Muzzle area

    // 2. GYROSCOPIC RINGS (Clean Loop)
    const addRing = (radius, axis, speedMult) => {
        const segments = 32;
        const startIdx = v.length;
        for(let i=0; i<segments; i++){
            let ang = (i/segments)*Math.PI*2;
            let rx = Math.cos(ang)*radius, rz = Math.sin(ang)*radius;
            v.push({x:rx, y:0, z:rz, type:'ring', axis, speed: speedMult});
        }
        // Draw as a wireframe ring (tube approximation)
        for(let i=0; i<segments; i++){
            f.push([startIdx+i, startIdx+((i+1)%segments), startIdx+i]); // Degenerate for thickness
        }
    };
    addRing(1.8, 'Y', 1.0);
    addRing(2.1, 'X', -0.8);
    addRing(2.4, 'Z', 0.5);
}

const LIGHT = { x: 0.5, y: 0.5, z: 1.0 };
const normalize = (v) => {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return { x: v.x / (len||1), y: v.y / (len||1), z: v.z / (len||1) };
};
const nLight = normalize(LIGHT);

function project(p) {
    const scale = 220, dist = 6.0;
    let x = p.x, y = p.y, z = p.z;
    
    // Per-object rotation for rings
    if(p.type === 'ring'){
        let ang = frame * 0.03 * p.speed;
        let c = Math.cos(ang), s = Math.sin(ang);
        if(p.axis === 'Y') { let tx = x*c-z*s; z = x*s+z*c; x = tx; }
        else if(p.axis === 'X') { let ty = y*c-z*s; z = y*s+z*c; y = ty; }
        else { let tx = x*c-y*s; y = x*s+y*c; x = tx; }
    }

    // Global Interactive Rotation (Gaze)
    let ry = rotationY + (mouseX * 1.2), rx = (mouseY * 0.8);
    let cRY = Math.cos(ry), sRY = Math.sin(ry), cRX = Math.cos(rx), sRX = Math.sin(rx);
    
    // Y-axis rotate
    let tx1 = x*cRY-z*sRY, tz1 = x*sRY+z*cRY;
    // X-axis rotate
    let ty2 = y*cRX-tz1*sRX, tz2 = y*sRX+tz1*cRX;

    const fact = scale / (tz2 + dist);
    return { x: tx1*fact + canvas.width/2, y: -ty2*fact + canvas.height/2, z: tz2, wx: tx1, wy: ty2, wz: tz2, type: p.type };
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rotationY += 0.003; frame++;
    mouseX = lerp(mouseX, targetX, 0.05); mouseY = lerp(mouseY, targetY, 0.05);

    const projected = MESH.vertices.map(v => project(v));
    const faceData = MESH.faces.map(indices => {
        const pts = indices.map(idx => projected[idx]);
        const avgZ = pts.reduce((s, p) => s + p.z, 0) / pts.length;
        
        // Normal for shading
        const v1 = { x: pts[1].wx-pts[0].wx, y: pts[1].wy-pts[0].wy, z: pts[1].wz-pts[0].wz };
        const v2 = { x: pts[2].wx-pts[0].wx, y: pts[2].wy-pts[0].wy, z: pts[2].wz-pts[0].wz };
        const n = normalize({ x: v1.y*v2.z-v1.z*v2.y, y: v1.z*v2.x-v1.x*v2.z, z: v1.x*v2.y-v1.y*v2.x });
        const dot = n.x*nLight.x + n.y*nLight.y + n.z*nLight.z;
        
        return { pts, avgZ, dot, isRing: pts[0].type === 'ring' };
    });

    // Z-Sort (Back to Front)
    faceData.sort((a, b) => b.avgZ - a.avgZ);

    faceData.forEach(f => {
        let col;
        if(f.isRing) col = f.dot > 0.4 ? `rgb(255,255,0)` : `rgb(160,160,0)`;
        else {
            if(f.dot > 0.7) col = `rgb(255,255,0)`;
            else if(f.dot > 0.2) col = `rgb(200,200,0)`;
            else col = `rgb(80,80,0)`;
        }
        
        ctx.beginPath();
        ctx.fillStyle = col;
        ctx.moveTo(f.pts[0].x, f.pts[0].y);
        for(let i=1; i<f.pts.length; i++) ctx.lineTo(f.pts[i].x, f.pts[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.2;
        ctx.stroke();
    });

    // Neural Eye Glow (Sockets: indices 8-11)
    [projected[8], projected[9]].forEach(p => {
        const glow = 0.5 + reaction;
        ctx.shadowBlur = 15; ctx.shadowColor = `yellow`;
        ctx.fillStyle = `rgba(255,255,0,${glow})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3+(reaction*8), 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    if (reaction > 0) reaction *= 0.95;
    requestAnimationFrame(render);
}

window.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    targetX = ((e.clientX-r.left)/canvas.width)-0.5; targetY = ((e.clientY-r.top)/canvas.height)-0.5;
});

function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
window.addEventListener('resize', resize);
resize(); initCyberSkull(); render();

const resList = ["neural bridge synced.", "rings holding at 100% stability.", "standing by, xavier."];
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
        const val = input.value; input.value = ''; reaction = 1.0;
        const uL = document.createElement('div'); uL.className = 'line'; uL.innerHTML = `<span class="user-tag">xavier:</span> <span class="user-msg">${val}</span>`;
        output.appendChild(uL);
        setTimeout(() => {
            const bL = document.createElement('div'); bL.className = 'line';
            bL.innerHTML = `<span class="bot">cypher:</span> ${resList[Math.floor(Math.random()*resList.length)]}`;
            output.appendChild(bL); output.scrollTop = output.scrollHeight;
        }, 500);
        output.scrollTop = output.scrollHeight;
    }
});
document.getElementById('terminal').addEventListener('click', () => input.focus());