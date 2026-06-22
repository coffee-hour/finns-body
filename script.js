/**
 * CYPHER TERMINAL v13.0.0
 * Stylized Cyber-Skull Engine with Gyroscopic Rings
 * 3D Solid Toon-Shaded Volumetric Mesh
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

    // 1. STYLIZED GEOMETRIC SKULL (v0-v25)
    // Cranium
    v.push({x:0, y:1, z:0}, {x:0.6, y:0.8, z:0.5}, {x:-0.6, y:0.8, z:0.5}, {x:0.5, y:0.8, z:-0.5}, {x:-0.5, y:0.8, z:-0.5});
    // Brow Ridge & Sockets
    v.push({x:0.4, y:0.4, z:0.8}, {x:-0.4, y:0.4, z:0.8}, {x:0.1, y:0.35, z:0.85}, {x:-0.1, y:0.35, z:0.85});
    v.push({x:0.3, y:0.1, z:0.9}, {x:-0.3, y:0.1, z:0.9}, {x:0.1, y:0.15, z:0.95}, {x:-0.1, y:0.15, z:0.95});
    // Nasal Gap
    v.push({x:0, y:0.1, z:1.0}, {x:0.1, y:-0.1, z:0.9}, {x:-0.1, y:-0.1, z:0.9});
    // Cheekbones
    v.push({x:0.7, y:0, z:0.6}, {x:-0.7, y:0, z:0.6}, {x:0.5, y:-0.2, z:0.8}, {x:-0.5, y:-0.2, z:0.8});
    // Jaw (Segmented)
    v.push({x:0.3, y:-0.7, z:0.6}, {x:-0.3, y:-0.7, z:0.6}, {x:0.1, y:-0.8, z:0.75}, {x:-0.1, y:-0.8, z:0.75}, {x:0, y:-0.6, z:0.9});

    // Skull Faces
    f.push([0,1,3],[0,2,4],[0,1,7],[0,2,8],[7,5,9],[8,6,10],[5,15,17],[6,16,18],[13,14,19],[17,19,23],[18,20,24],[19,20,23],[20,21,24],[21,22,23],[21,22,24]);

    // 2. GYROSCOPIC RINGS (Procedural)
    const addRing = (radius, vertOffset, axis) => {
        const segments = 24;
        const startIdx = v.length;
        for(let i=0; i<segments; i++){
            let ang = (i/segments)*Math.PI*2;
            let rx = Math.cos(ang)*radius, rz = Math.sin(ang)*radius;
            v.push({x:rx, y:0, z:rz, type:'ring', axis});
        }
        for(let i=0; i<segments; i++){
            f.push([startIdx+i, startIdx+((i+1)%segments), 0]); // Connect to center for solid triangle strip
        }
    };
    addRing(1.6, 0, 'Y');
    addRing(1.9, 0, 'X');
}

const LIGHT = { x: 0.6, y: 0.6, z: 1.0 };
const normalize = (v) => {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return { x: v.x / len, y: v.y / len, z: v.z / len };
};
const nLight = normalize(LIGHT);

function project(p) {
    const scale = 220, dist = 6.0;
    let x = p.x, y = p.y, z = p.z;
    
    // Ring Auto-Rotation
    if(p.type === 'ring'){
        let ang = frame * 0.04 * (p.axis === 'X' ? 1 : -1.2);
        let cosA = Math.cos(ang), sinA = Math.sin(ang);
        if(p.axis === 'Y') { let tx = x*cosA-z*sinA; z = x*sinA+z*cosA; x = tx; }
        else { let ty = y*cosA-z*sinA; z = y*sinA+z*cosA; y = ty; }
    }

    // Global Interaction Rotation
    let ry = rotationY + (mouseX * 1.4), rx = (mouseY * 0.8);
    let cRY = Math.cos(ry), sRY = Math.sin(ry), cRX = Math.cos(rx), sRX = Math.sin(rx);
    let tx = x*cRY-z*sRY, tz = x*sRY+z*cRY, ty = y*cRX-tz*sRX;
    let fZ = y*sRX+tz*cRX;

    const fact = scale / (fZ + dist);
    return { x: tx*fact + canvas.width/2, y: -ty*fact + canvas.height/2, z: fZ, wx: tx, wy: ty, wz: fZ, type: p.type };
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rotationY += 0.005; frame++;
    mouseX = lerp(mouseX, targetX, 0.05); mouseY = lerp(mouseY, targetY, 0.05);

    const projected = MESH.vertices.map(v => project(v));
    const faceData = MESH.faces.map(indices => {
        const pts = indices.map(idx => projected[idx]);
        const avgZ = pts.reduce((s, p) => s + p.z, 0) / pts.length;
        const vA = { x: pts[1].wx-pts[0].wx, y: pts[1].wy-pts[0].wy, z: pts[1].wz-pts[0].wz };
        const vB = { x: pts[2].wx-pts[0].wx, y: pts[2].wy-pts[0].wy, z: pts[2].wz-pts[0].wz };
        const norm = normalize({ x: vA.y*vB.z-vA.z*vB.y, y: vA.z*vB.x-vA.x*vB.z, z: vA.x*vB.y-vA.y*vB.x });
        const dot = norm.x*nLight.x + norm.y*nLight.y + norm.z*nLight.z;
        return { pts, avgZ, dot, isRing: pts[0].type === 'ring' };
    });

    faceData.sort((a, b) => b.avgZ - a.avgZ);

    faceData.forEach(f => {
        let col;
        if(f.isRing) col = f.dot > 0.5 ? `rgb(255,255,0)` : `rgb(150,150,0)`;
        else col = f.dot > 0.6 ? `rgb(255,255,0)` : f.dot > 0.2 ? `rgb(200,200,0)` : `rgb(80,80,0)`;
        
        ctx.beginPath(); ctx.fillStyle = col;
        ctx.moveTo(f.pts[0].x, f.pts[0].y);
        for(let i=1; i<f.pts.length; i++) ctx.lineTo(f.pts[i].x, f.pts[i].y);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // Eye Glow
    projected.slice(11,13).forEach(p => {
        ctx.fillStyle = `rgba(255,255,0, ${0.8 + reaction})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4+(reaction*10), 0, Math.PI*2); ctx.fill();
    });

    if (reaction > 0) reaction *= 0.94;
    requestAnimationFrame(render);
}

window.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    targetX = ((e.clientX-r.left)/canvas.width)-0.5; targetY = ((e.clientY-r.top)/canvas.height)-0.5;
});

function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
window.addEventListener('resize', resize);
resize(); initCyberSkull(); render();

const res = ["neural ID: cyber-skull. sequence active.", "gyroscopic rings synchronized.", "welcome, xavier. ready to lock in?"];
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
        const val = input.value; input.value = ''; reaction = 0.8;
        const uL = document.createElement('div'); uL.className = 'line'; uL.innerHTML = `<span class="user-tag">xavier:</span> <span class="user-msg">${val}</span>`;
        output.appendChild(uL);
        setTimeout(() => {
            const bL = document.createElement('div'); bL.className = 'line';
            bL.innerHTML = `<span class="bot">cypher:</span> ${res[Math.floor(Math.random()*res.length)]}`;
            output.appendChild(bL); output.scrollTop = output.scrollHeight;
        }, 500);
        output.scrollTop = output.scrollHeight;
    }
});
document.getElementById('terminal').addEventListener('click', () => input.focus());