export function rectangles(cells, size, merge) {
  const width = 400 / size;
  const result = [];
  for (let row = 0; row < width; row++) {
    for (let col = 0; col < width; col++) {
      const color = cells[row * width + col];
      if (!color) continue;
      let run = 1;
      if (merge) {
        while (col + run < width && cells[row * width + col + run] === color) run++;
      }
      result.push({color, x: col * size, y: row * size, w: run * size, h: size});
      col += run - 1;
    }
  }
  return result;
}

export function generateCode(cells, size, options) {
  const shapes = rectangles(cells, size, options.merge);
  const lines = ['// My Game Lab drawing · 400 x 400 canvas'];
  if (options.outlines) lines.push('noStroke();');
  if (options.includeBg) lines.push('fill("' + options.bg + '");', 'rect(0, 0, 400, 400);');
  let previousColor = null;
  for (const shape of shapes) {
    if (shape.color !== previousColor) {
      lines.push('', 'fill("' + shape.color + '");');
      previousColor = shape.color;
    }
    lines.push('rect(' + [shape.x, shape.y, shape.w, shape.h].join(', ') + ');');
  }
  if (!shapes.length) lines.push('', '// Paint on the grid to add your shapes.');
  return {code: lines.join('\n'), count: shapes.length};
}

export function validateDrawing(value) {
  if (!value || ![5, 10, 20, 40].includes(value.size) || !Array.isArray(value.cells) ||
      value.cells.length !== Math.pow(400 / value.size, 2) ||
      !value.cells.every(color => color === null || /^#[0-9a-f]{6}$/i.test(color))) {
    throw new Error('Choose a Pixel Studio drawing file.');
  }
  return {size: value.size, cells: value.cells.map(color => color && color.toLowerCase())};
}
