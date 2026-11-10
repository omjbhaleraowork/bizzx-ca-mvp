const MAX_IMAGE_DIMENSION = 1800;
const EDGE_FEATHER = 24;

export async function removeSampledBackground(
  source: Blob,
  sampleX: number,
  sampleY: number,
  tolerance: number,
): Promise<Blob> {
  const image = await createImageBitmap(source);
  const resize = Math.min(
    1,
    MAX_IMAGE_DIMENSION / image.width,
    MAX_IMAGE_DIMENSION / image.height,
  );
  const width = Math.max(1, Math.round(image.width * resize));
  const height = Math.max(1, Math.round(image.height * resize));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  try {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Image editing is unavailable in this browser.");
    context.drawImage(image, 0, 0, width, height);

    const pixels = context.getImageData(0, 0, width, height);
    const { data } = pixels;
    const sampleIndex =
      Math.min(height - 1, Math.floor(sampleY * height)) * width * 4 +
      Math.min(width - 1, Math.floor(sampleX * width)) * 4;
    const red = data[sampleIndex];
    const green = data[sampleIndex + 1];
    const blue = data[sampleIndex + 2];
    const maxDistance = tolerance + EDGE_FEATHER;
    const maxDistanceSquared = maxDistance * maxDistance;
    const toleranceSquared = tolerance * tolerance;
    const totalPixels = width * height;
    const visited = new Uint8Array(totalPixels);
    const queue = new Uint32Array(totalPixels);
    let head = 0;
    let tail = 0;
    const firstPixel = Math.min(height - 1, Math.floor(sampleY * height)) * width +
      Math.min(width - 1, Math.floor(sampleX * width));
    queue[tail++] = firstPixel;
    visited[firstPixel] = 1;

    while (head < tail) {
      const pixel = queue[head++];
      const offset = pixel * 4;
      const dr = data[offset] - red;
      const dg = data[offset + 1] - green;
      const db = data[offset + 2] - blue;
      const distanceSquared = dr * dr + dg * dg + db * db;

      if (distanceSquared > maxDistanceSquared) continue;

      if (distanceSquared <= toleranceSquared) {
        data[offset + 3] = 0;
      } else {
        const distance = Math.sqrt(distanceSquared);
        const remainingAlpha = (distance - tolerance) / EDGE_FEATHER;
        data[offset + 3] = Math.round(data[offset + 3] * remainingAlpha);
      }

      const x = pixel % width;
      const addNeighbor = (neighbor: number) => {
        if (!visited[neighbor]) {
          visited[neighbor] = 1;
          queue[tail++] = neighbor;
        }
      };

      if (x > 0) addNeighbor(pixel - 1);
      if (x < width - 1) addNeighbor(pixel + 1);
      if (pixel >= width) addNeighbor(pixel - width);
      if (pixel < totalPixels - width) addNeighbor(pixel + width);
    }

    context.putImageData(pixels, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not export the background-removed image."));
        },
        "image/png",
      );
    });
  } finally {
    image.close();
  }
}
