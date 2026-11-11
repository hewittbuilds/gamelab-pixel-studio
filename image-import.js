// Convert sampled RGBA squares into editable colors, preserving empty pixels.
export function pixelColors(data, limit) {
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    pixels.push(data[i + 3] < 128 ? null : [data[i], data[i + 1], data[i + 2]]);
  }
  const visible = pixels.filter(Boolean);
  if (!visible.length) return pixels;
  const hex = rgb => '#' + rgb.map(value => Math.round(value).toString(16).padStart(2, '0')).join('');
  if (!limit) return pixels.map(pixel => pixel && hex(pixel));

  const distance = (a, b) => (a[0]-b[0]) ** 2 + (a[1]-b[1]) ** 2 + (a[2]-b[2]) ** 2;
  const nearest = (pixel, palette) => {
    let best = 0;
    for (let i = 1; i < palette.length; i++) {
      if (distance(pixel, palette[i]) < distance(pixel, palette[best])) best = i;
    }
    return best;
  };
  const unique = [...new Map(visible.map(pixel => [hex(pixel), pixel])).values()];
  if (unique.length <= limit) return pixels.map(pixel => pixel && hex(pixel));

  // Start with separated colors, then fit the palette to the image.
  const palette = [unique[0]];
  while (palette.length < limit) {
    let candidate = unique[0];
    let farthest = -1;
    for (const pixel of unique) {
      const gap = distance(pixel, palette[nearest(pixel, palette)]);
      if (gap > farthest) { farthest = gap; candidate = pixel; }
    }
    palette.push(candidate);
  }
  for (let pass = 0; pass < 8; pass++) {
    const sums = palette.map(() => [0, 0, 0, 0]);
    for (const pixel of visible) {
      const sum = sums[nearest(pixel, palette)];
      for (let channel = 0; channel < 3; channel++) sum[channel] += pixel[channel];
      sum[3]++;
    }
    sums.forEach((sum, index) => {
      if (sum[3]) palette[index] = sum.slice(0, 3).map(value => value / sum[3]);
    });
  }
  return pixels.map(pixel => pixel && hex(palette[nearest(pixel, palette)]));
}

export function cropRectangle(width, height, zoom, horizontal, vertical) {
  const side = Math.min(width, height) / zoom;
  return {x: (width - side) * horizontal / 100, y: (height - side) * vertical / 100, side};
}
