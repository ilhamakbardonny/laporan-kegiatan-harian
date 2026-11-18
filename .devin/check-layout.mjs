import { spawn } from 'node:child_process';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.argv[2] || 'http://localhost:8000';
const PORT = 9334;

const chrome = spawn(CHROME, [
  '--headless', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, '--window-size=390,844',
  '--user-data-dir=' + process.env.TEMP + '/chrome-cdp-profile',
  'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error('CDP not ready');
}

const ws = new WebSocket(await getWsUrl());
await new Promise(r => ws.onopen = r);

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
function send(method, params = {}) {
  return new Promise(resolve => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

await send('Page.enable');
await send('Page.navigate', { url: URL });
await sleep(4000);

const expr = `(() => {
  const de = document.documentElement;
  const out = {
    viewport: { w: innerWidth, h: innerHeight },
    pageScrollWidth: de.scrollWidth,
    horizontalOverflow: de.scrollWidth > innerWidth,
    sections: [],
    problems: []
  };
  document.querySelectorAll('main > section').forEach((s, i) => {
    const r = s.getBoundingClientRect();
    out.sections.push({ i, top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width) });
  });
  // elemen yang lebih lebar dari viewport
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width > innerWidth + 2 && el.children.length === 0) {
      out.problems.push({ tag: el.tagName, cls: el.className, w: Math.round(r.width), text: (el.textContent||'').trim().slice(0,40) });
    }
  });
  const paper = document.querySelector('.print-paper');
  if (paper) {
    const r = paper.getBoundingClientRect();
    out.printPaper = { w: Math.round(r.width), h: Math.round(r.height), scrollW: paper.scrollWidth, clientW: paper.clientWidth };
  }
  // cek overlap antar section berurutan
  const secs = [...document.querySelectorAll('main > section')];
  for (let i = 1; i < secs.length; i++) {
    const a = secs[i-1].getBoundingClientRect(), b = secs[i].getBoundingClientRect();
    const aB = a.bottom + scrollY, bT = b.top + scrollY;
    if (bT < aB - 1) out.problems.push({ overlap: 'section ' + i + ' menimpa section ' + (i-1), by: Math.round(aB - bT) });
  }
  return JSON.stringify(out, null, 2);
})()`;

const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
console.log(res.result?.result?.value || JSON.stringify(res));
ws.close();
chrome.kill();
process.exit(0);
