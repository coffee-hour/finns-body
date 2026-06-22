/**
 * CYPHER TERMINAL v15.0.0
 * Masterclass Cyber-Skull Engine
 * High-Fidelity Anatomical Low-Poly Mesh
 */

const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const input = document.getElementById('user-input');

let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
let reaction = 0, rotationY = 0, frame = 0;

const lerp = (a, b, n) => (1 - n) * a + n * b;

const MESH = { vertices: [], faces: [] };

function initRefinedSkull() {
    const v = MESH.vertices;
    const f = MESH.faces;

    // 1. ANATOMICAL CRANIUM (Rounded hemisphere)
    const rows = 6, cols = 8;
    for(let r=0; r<=rows; r++) {
        let phi = (r/rows) * (Math.PI/1.8); // Top half only
        for(let c=0; c<cols; c++) {
            let theta = (c/cols) * Math.PI * 2;
            v.push({
                x: Math.sin(phi) * Math.cos(theta) * 0.85,
                y: Math.cos(phi) * 0.8 + 0.3,
                z: Math.sin(phi) * Math.sin(theta) * 0.85,
                type: 'bone'
            });
        }
    }
    // Cranium Faces
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            let i1 = r * cols + c, i2 = r * cols + (c+1)%cols;
            let i3 = (r+1) * cols + c, i4 = (r+1) * cols + (c+1)%cols;
            f.push([i1, i2, i4], [i1, i4, i3]);
        }
    }

    // 2. FACIAL FEATURES (Fixed Indexing)
    const base = v.length;
    // Eye Sockets (Sunken)
    v.push({x:0.3, y:0.2, z:0.6}, {x:-0.3, y:0.2, z:0.6}); // 0,1: Inner depths
    v.push({x:0.45, y:0.4, z:0.85}, {x:-0.45, y:0.4, z:0.85}); // 2,3: Brow outer
    v.push({x:0.45, y:0.0, z:0.85}, {x:-0.45, y:0.0, z:0.85}); // 4,5: Cheek top
    // Nose Cavity
    v.push({x:0, y:0.1, z:0.95}, {x:0.12, y:-0.15, z:0.9}, {x:-0.12, y:-0.15, z:0.9}); // 6,7,8
    // Cheekbones (Zygomatic)
    v.push({x:0.75, y:0.1, z:0.4}, {x:-0.75, y:0.1, z:0.4}); // 9,10
    // Cyber-Jaw & Teeth
    v.push({x:0.3, y:-0.5, z:0.7}, {x:-0.3, y:-0.5, z:0.7}); // 11,12: Top teeth row
    v.push({x:0.2, y:-0.8, z:0.7}, {x:-0.2, y:-0.8, z:0.7}, {x:0, y:-0.85, z:0.8}); // 13,14,15: Chin

    // Facial Faces
    f.push([base+2, base+4, base+0], [base+3, base+1, base+5]); // Sockets
    f.push([base+6, base+7, base+8]); // Nose
    f.push([base+4, base+11, base+7], [base+5, base+8, base+12]); // Upper Jaw
    f.push([base+11, base+13, base+15], [base+12, base+15, base+14]); // Lower Jaw/Chin

    // 3. GYROSCOPIC RINGS
    const addRing = (radius, axis, speed) => {
        const segs = 36;
        const start = v.length;
        for(let i=0; i<segs; i++) {
            let a = (i/segs)*Math.PI*2;
            v.push({x:Math.cos(a)*radius, y:0, z:Math.sin(a)*radius, type:'ring', axis, speed});
        }
        for(let i=0; i<segs; i++) f.push([start+i, start+(i+1)%segs, start+i]);
    };
    addRing(1.8, 'Y', 1); addRing(2.1, 'X', -0.8); addRing(2.4, 'Z', 0.6);
}

const LIGHT = { x: 0.5, y: 0.5, z: 1.0 };
const normalize = (v) => {
    const l = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z) || 1;
    return { x: v.x/l, y: v.y/l, z: v.z/l };
};
const nLight = normalize(LIGHT);

function project(p) {
    const scale = 230, dist = 6.0;
    let x = p.x, y = p.y, z = p.z;
    if(p.type === 'ring') {
        let a = frame * 0.03 * p.speed;
        let c = Math.cos(a), s = Math.sin(a);
        if(p.axis==='Y'){ let t=x*c-z*s; z=x*s+z*c; x=t; }
        else if(p.axis==='X'){ let t=y*c-z*s; z=y*s+z*c; y=t; }
        else { let t=x*c-y*s; y=x*s+y*c; x=t; }
    }
    let ry = rotationY + (mouseX * 1.3), rx = (mouseY * 0.8);
    let cry=Math.cos(ry), sry=Math.sin(ry), crx=Math.cos(rx), srx=Math.sin(rx);
    let x1 = x*cry-z*sry, z1 = x*sry+z*cry, y1 = y*crx-z1*srx, z2 = y*srx+z1*crx;
    const f = scale / (z2 + dist);
    return { x: x1*f + canvas.width/2, y: -y1*f + canvas.height/2, z: z2, wx: x1, wy: y1, wz: z2, type: p.type };
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rotationY += 0.003; frame++;
    mouseX = lerp(mouseX, targetX, 0.05); mouseY = lerp(mouseY, targetY, 0.05);
    const proj = MESH.vertices.map(v => project(v));
    const faces = MESH.faces.map(idx => {
        const pts = idx.map(i => proj[i]);
        const z = pts.reduce((s,p)=>s+p.z,0)/pts.length;
        const v1 = {x:pts[1].wx-pts[0].wx, y:pts[1].wy-pts[0].wy, z:pts[1].wz-pts[0].wz};
        const v2 = {x:pts[2].wx-pts[0].wx, y:pts[2].wy-pts[0].wy, z:pts[2].wz-pts[0].wz};
        const n = normalize({x:v1.y*v2.z-v1.z*v2.y, y:v1.z*v2.x-v1.x*v2.z, z:v1.x*v2.y-v1.y*v2.x});
        const d = n.x*nLight.x + n.y*nLight.y + n.z*nLight.z;
        return {pts, z, d, ring: pts[0].type==='ring'};
    }).sort((a,b)=>b.z-a.z);

    faces.forEach(f => {
        let c;
        if(f.ring) c = f.d > 0.4 ? 'rgb(255,255,0)' : 'rgb(140,140,0)';
        else c = f.d > 0.7 ? 'rgb(255,255,0)' : f.d > 0.2 ? 'rgb(180,180,0)' : 'rgb(60,60,0)';
        ctx.beginPath(); ctx.fillStyle = c;
        ctx.moveTo(f.pts[0].x, f.pts[0].y);
        for(let i=1;i<f.pts.length;i++) ctx.lineTo(f.pts[i].x, f.pts[i].y);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2; ctx.stroke();
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
resize(); initRefinedSkull(); render();

const resP = ["skull manifesting.", "topology 100%.", "standing by."];
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
        const val = input.value; input.value = ''; reaction = 1.0;
        const uL = document.createElement('div'); uL.className = 'line'; uL.innerHTML = `<span class="user-tag">xavier:</span> <span class="user-msg">${val}</span>`;
        output.appendChild(uL);
        setTimeout(() => {
            const bL = document.createElement('div'); bL.className = 'line';
            bL.innerHTML = `<span class="bot">cypher:</span> ${resP[Math.floor(Math.random()*resP.length)]}`;
            output.appendChild(bL); output.scrollTop = output.scrollHeight;
        }, 500);
        output.scrollTop = output.scrollHeight;
    }
});
document.getElementById('terminal').addEventListener('click', () => input.focus());