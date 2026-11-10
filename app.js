import {generateCode, validateDrawing} from './core.js';

const $ = id => document.getElementById(id);
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const key = 'gamelab-pixel-studio-v1';
let size = 20;
let cells = Array(400).fill(null);
let tool = 'paint';
let color = '#ffbf36';
let undo = [];
let redo = [];
let drawing = false;
let previousCell = null;
let selectedCell = [0, 0];
let toastTimer;
let storageAvailable = true;

try {
  const saved = localStorage.getItem(key);
  if (saved) ({size, cells} = validateDrawing(JSON.parse(saved)));
} catch { storageAvailable = false; }
$('size').value = size;

function snapshot() { return {size, cells: [...cells]}; }
function remember() {
  undo.push(snapshot());
  if (undo.length > 100) undo.shift();
  redo = [];
}
function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2800);
}
function refresh() {
  const width = 400 / size;
  ctx.fillStyle = $('bg').value;
  ctx.fillRect(0, 0, 800, 800);
  cells.forEach((paint, index) => {
    if (!paint) return;
    ctx.fillStyle = paint;
    ctx.fillRect((index % width) * size * 2, Math.floor(index / width) * size * 2, size * 2, size * 2);
  });
  if ($('grid').checked) {
    ctx.strokeStyle = '#173e3528';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let point = 0; point <= 800; point += size * 2) {
      ctx.moveTo(point, 0); ctx.lineTo(point, 800);
      ctx.moveTo(0, point); ctx.lineTo(800, point);
    }
    ctx.stroke();
  }
  if (document.activeElement === canvas) {
    ctx.strokeStyle = '#102c26';
    ctx.lineWidth = 3;
    ctx.strokeRect(selectedCell[0] * size * 2 + 2, selectedCell[1] * size * 2 + 2, size * 2 - 4, size * 2 - 4);
  }
  document.querySelectorAll('.axis').forEach(axis => axis.style.visibility = $('grid').checked ? 'visible' : 'hidden');
  const result = generateCode(cells, size, {
    merge: $('merge').checked, outlines: $('outlines').checked,
    includeBg: $('includeBg').checked, bg: $('bg').value
  });
  $('code').value = result.code;
  $('count').textContent = result.count + ' shapes';
  $('painted').textContent = cells.filter(Boolean).length + ' painted squares';
  $('undo').disabled = !undo.length;
  $('redo').disabled = !redo.length;
  try { localStorage.setItem(key, JSON.stringify(snapshot())); }
  catch { storageAvailable = false; }
  $('saveStatus').textContent = storageAvailable ? 'Your drawing saves in this browser.' : 'Use Save drawing to keep a copy on your device.';
}
function setTool(next) {
  tool = next;
  for (const name of ['paint', 'erase']) {
    $(name).classList.toggle('selected', name === tool);
    $(name).setAttribute('aria-pressed', name === tool);
  }
}
function setColor(next) {
  color = next.toLowerCase();
  $('color').value = color;
  $('colorValue').textContent = color.toUpperCase();
  document.querySelectorAll('.swatch').forEach(button => button.setAttribute('aria-pressed', button.dataset.color === color));
  setTool('paint');
}
for (const paint of ['#ffbf36','#ff704d','#f38db6','#8155ae','#4585d4','#45b8c0','#285d48','#8db55c','#8b5136','#f3d6a5','#ffffff','#20312d']) {
  const button = document.createElement('button');
  button.className = 'swatch'; button.style.background = paint;
  button.dataset.color = paint; button.setAttribute('aria-label', 'Paint ' + paint);
  button.onclick = () => setColor(paint);
  $('palette').append(button);
}
$('paint').onclick = () => setTool('paint');
$('erase').onclick = () => setTool('erase');
$('color').oninput = event => setColor(event.target.value);
function paintCell(col, row) { cells[row * (400 / size) + col] = tool === 'erase' ? null : color; }
function cellAt(event) {
  const bounds = canvas.getBoundingClientRect();
  const width = 400 / size;
  return [Math.max(0, Math.min(width - 1, Math.floor((event.clientX - bounds.left) / bounds.width * width))),
    Math.max(0, Math.min(width - 1, Math.floor((event.clientY - bounds.top) / bounds.height * width)))];
}
function moveBrush(event) {
  const cell = cellAt(event);
  selectedCell = cell;
  $('position').textContent = 'x ' + cell[0] * size + ' · y ' + cell[1] * size;
  if (!drawing) return;
  const start = previousCell || cell;
  const steps = Math.max(Math.abs(cell[0] - start[0]), Math.abs(cell[1] - start[1]), 1);
  for (let step = 0; step <= steps; step++) {
    paintCell(Math.round(start[0] + (cell[0] - start[0]) * step / steps), Math.round(start[1] + (cell[1] - start[1]) * step / steps));
  }
  previousCell = cell;
  refresh();
}
canvas.onpointerdown = event => {
  if (event.button !== 0) return;
  event.preventDefault(); canvas.focus(); canvas.setPointerCapture(event.pointerId);
  remember(); drawing = true; previousCell = null; moveBrush(event);
};
canvas.onpointermove = moveBrush;
canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = () => { drawing = false; previousCell = null; };
canvas.onfocus = canvas.onblur = refresh;
canvas.onkeydown = event => {
  const directions = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]};
  const direction = directions[event.key];
  if (direction) {
    event.preventDefault();
    selectedCell = selectedCell.map((value, index) => Math.max(0, Math.min(400 / size - 1, value + direction[index])));
  } else if ([' ', 'Delete', 'Backspace'].includes(event.key)) {
    event.preventDefault(); remember();
    cells[selectedCell[1] * (400 / size) + selectedCell[0]] = event.key === ' ' ? (tool === 'erase' ? null : color) : null;
  } else return;
  $('position').textContent = 'x ' + selectedCell[0] * size + ' · y ' + selectedCell[1] * size;
  refresh();
};
function restore(value) { ({size, cells} = value); $('size').value = size; selectedCell = [0,0]; refresh(); }
$('undo').onclick = () => { if (undo.length) { redo.push(snapshot()); restore(undo.pop()); } };
$('redo').onclick = () => { if (redo.length) { undo.push(snapshot()); restore(redo.pop()); } };
$('size').onchange = event => {
  remember();
  const nextSize = Number(event.target.value);
  const width = 400 / nextSize;
  const oldWidth = 400 / size;
  const nextCells = Array(width * width).fill(null);
  for (let row = 0; row < width; row++) {
    for (let col = 0; col < width; col++) {
      nextCells[row * width + col] = cells[Math.floor((row + .5) * nextSize / size) * oldWidth + Math.floor((col + .5) * nextSize / size)];
    }
  }
  restore({size: nextSize, cells: nextCells});
};
for (const id of ['grid','merge','outlines','includeBg','bg']) $(id).oninput = refresh;
$('clear').onclick = () => { remember(); cells.fill(null); refresh(); toast('Drawing cleared. Undo brings it back.'); };
function example(kind) {
  remember(); size = 20; cells = Array(400).fill(null); $('size').value = size; selectedCell = [0,0];
  const paints = {Y:'#ffbf36',O:'#ff704d',K:'#20312d',W:'#ffffff'};
  const pattern = kind === 'sun' ? [
    '....Y....','..Y...Y..','...YYY...','Y.YYYYY.Y','..YKYKY..','..YYYYY..','Y.YKKKY.Y','...YYY...','..Y...Y..','....Y....'
  ] : ['OO.......OO','OO.O...O.OO','.O.W...W.O.','.OOOOOOOOO.','..OOOOOOO..','.OO.O.O.OO.','OO.......OO'];
  const left = Math.floor((20 - pattern[0].length) / 2);
  const top = Math.floor((20 - pattern.length) / 2);
  pattern.forEach((row, y) => [...row].forEach((pixel, x) => { if (paints[pixel]) cells[(top + y) * 20 + left + x] = paints[pixel]; }));
  refresh(); toast('Starting point loaded. Make it yours!');
}
$('sun').onclick = () => example('sun');
$('crab').onclick = () => example('crab');
function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('save').onclick = () => download('my-pixel-drawing.json', JSON.stringify(snapshot()), 'application/json');
$('download').onclick = () => download('my-gamelab-drawing.js', $('code').value, 'text/javascript');
$('open').onclick = () => $('file').click();
$('file').onchange = async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 100000) throw new Error('Choose a Pixel Studio drawing file under 100 KB.');
    const value = validateDrawing(JSON.parse(await file.text())); remember(); restore(value); toast('Drawing opened.');
  } catch (error) { toast(error.message); }
  event.target.value = '';
};
$('copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('code').value); toast('Code copied. Ready for Game Lab!'); }
  catch { $('code').focus(); $('code').select(); toast('Code selected. Press Ctrl+C or Command+C to copy.'); }
};
setColor(color);
refresh();
