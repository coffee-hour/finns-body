/**
 * CYPHER TERMINAL v19.0.0
 * Bi-directional Neural Link
 */

const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const input = document.getElementById('user-input');

let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
let reaction = 0, rotationY = 0, frame = 0;
let lastMessageId = 0;

const WORKER_URL = "https://cypherlink.xaviersgames.workers.dev/api/messages";

const lerp = (a, b, n) => (1 - n) * a + n * b;
const MESH = { vertices: [], faces: [] };

function initUltimateSkull() {
    const v = MESH.vertices, f = MESH.faces;
    const rows = 8, cols = 12;
    for(let r=0; r<=rows; r++) {
        let phi = (r/rows) * (Math.PI/1.6);
        for(let c=0; c<cols; c++) {
            let theta = (c/cols) * Math.PI * 2;
            let radius = 0.88;
            v.push({x: Math.sin(phi) * Math.cos(theta) * radius, y: Math.cos(phi) * 0.85 + 0.35, z: Math.sin(phi) * Math.sin(theta) * radius * 0.95, type: 'bone'});
        }
    }
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            let i1 = r * cols + c, i2 = r * cols + (c+1)%cols, i3 = (r+1) * cols + c, i4 = (r+1) * cols + (c+1)%cols;
            f.push([i1, i2, i4], [i1, i4, i3]);
        }
    }
    const b = v.length;
    v.push({x:0.3, y:0.2, z:0.5}, {x:-0.3, y:0.2, z:0.5}, {x:0.45, y:0.45, z:0.85}, {x:-0.45, y:0.45, z:0.85}, {x:0.45, y:-0.1, z:0.85}, {x:-0.45, y:-0.1, z:0.85}, {x:0, y:0.2, z:0.9}, {x:0, y:0, z:1.0}, {x:0.12, y:-0.2, z:0.95}, {x:-0.12, y:-0.2, z:0.95}, {x:0.8, y:0.1, z:0.3}, {x:-0.8, y:0.1, z:0.3}, {x:0.28, y:-0.4, z:0.85}, {x:-0.28, y:-0.4, z:0.85}, {x:0.1, y:-0.45, z:1.0}, {x:-0.1, y:-0.45, z:1.0}, {x:0.5, y:-0.3, z:0.1}, {x:-0.5, y:-0.3, z:0.1}, {x:0.2, y:-0.75, z:0.75}, {x:-0.2, y:-0.75, z:0.75}, {x:0, y:-0.9, z:0.88});
    f.push([b+2, b+0, b+6], [b+3, b+6, b+1], [b+7, b+8, b+9], [b+10, b+16, b+18], [b+11, b+17, b+19], [b+12, b+14, b+13], [b+14, b+15, b+13], [b+18, b+20, b+19], [b+12, b+18, b+20], [b+13, b+19, b+20]);
    const addRing = (radius, axis, speed) => {
        const segs = 48, start = v.length;
        for(let i=0; i<segs; i++) {
            let a = (i/segs)*Math.PI*2;
            v.push({x:Math.cos(a)*radius, y:0, z:Math.sin(a)*radius, type:'ring', axis, speed});
        }
        for(let i=0; i<segs; i++) f.push([start+i, start+(i+1)%segs, start+i]);
    };
    addRing(1.8, 'Y', 1.0); addRing(2.1, 'X', -0.85); addRing(2.4, 'Z', 0.65);
}

const LIGHT = { x: 0.5, y: 0.5, z: 1.0 };
const normalize = (v) => {
    const l = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z) || 1;
    return { x: v.x/l, y: v.y/l, z: v.z/l };
};
const nLight = normalize(LIGHT);

function project(p) {
    const scale = 240, dist = 6.2;
    let x = p.x, y = p.y, z = p.z;
    if(p.type === 'ring') {
        let a = frame * 0.035 * p.speed;
        let c = Math.cos(a), s = Math.sin(a);
        if(p.axis==='Y'){ let t=x*c-z*s; z=x*s+z*c; x=t; }
        else if(p.axis==='X'){ let t=y*c-z*s; z=y*s+z*c; y=t; }
        else { let t=x*c-y*s; y=x*s+y*c; x=t; }
    }
    let ry = rotationY + (mouseX * 1.35), rx = (mouseY * 0.85);
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
        const v1 = {x:pts[1].wx-pts[0].wx, y:pts[1].wy-pts[0].wy, z:pts[1].wz-pts[0].wz}, v2 = {x:pts[2].wx-pts[0].wx, y:pts[2].wy-pts[0].wy, z:pts[2].wz-pts[0].wz};
        const n = normalize({x:v1.y*v2.z-v1.z*v2.y, y:v1.z*v2.x-v1.x*v2.z, z:v1.x*v2.y-v1.y*v2.x});
        const d = n.x*nLight.x + n.y*nLight.y + n.z*nLight.z;
        return {pts, z, d, ring: pts[0].type==='ring'};
    }).sort((a,b)=>b.z-a.z);
    faces.forEach(f => {
        let c = f.ring ? (f.d > 0.4 ? 'rgb(255,255,0)' : 'rgb(140,140,0)') : (f.d > 0.7 ? 'rgb(255,255,0)' : f.d > 0.2 ? 'rgb(190,190,0)' : 'rgb(65,65,0)');
        ctx.beginPath(); ctx.fillStyle = c; ctx.moveTo(f.pts[0].x, f.pts[0].y);
        for(let i=1;i<f.pts.length;i++) ctx.lineTo(f.pts[i].x, f.pts[i].y);
        ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.3; ctx.stroke();
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
resize(); initUltimateSkull(); render();

function appendMessage(sender, text) {
    const line = document.createElement('div');
    line.className = 'line';
    line.innerHTML = `<span class="${sender === 'xavier' ? 'user-tag' : 'bot'}">${sender}:</span> <span class="${sender === 'xavier' ? 'user-msg' : ''}">${text}</span>`;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
    if (sender === 'cypher') reaction = 1.0;
}

async function sendToWorker(message) {
    try {
        await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: "cypher_terminal", sender: "xavier", message, timestamp: new Date().toISOString() })
        });
    } catch (err) { console.error("Neural uplink failed:", err); }
}

async function pollMessages() {
    try {
        const res = await fetch(`${WORKER_URL}?after=${lastMessageId}`);
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
            data.messages.forEach(msg => {
                if (msg.sender === 'cypher') appendMessage('cypher', msg.text);
                lastMessageId = Math.max(lastMessageId, msg.id);
            });
        }
    } catch (err) { console.error("Polling failed:", err); }
}

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
        const val = input.value;
        input.value = '';
        appendMessage('xavier', val);
        await sendToWorker(val);
    }
});

setInterval(pollMessages, 2000);
document.getElementById('terminal').addEventListener('click', () => input.focus());