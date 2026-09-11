// LBM1: original float32 records. LBM2: gzip transport, quantized coordinates/confidence.
export async function decodePointcloud(buffer) {
  let bytes = new Uint8Array(buffer);
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    buffer = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    bytes = new Uint8Array(buffer);
  }
  if (bytes.length < 8) throw new Error('Incomplete pointcloud header');
  const view = new DataView(buffer), magic = String.fromCharCode(...bytes.subarray(0, 4));
  const n = view.getUint32(4, true);
  if (magic === 'LBM1') {
    const rgbOffset = 8 + n * 12, qOffset = Math.ceil((rgbOffset + n * 3) / 4) * 4;
    if (buffer.byteLength !== qOffset + n * 4) throw new Error('Incomplete pointcloud');
    return { n, xyz: new Float32Array(buffer, 8, n * 3), rgb: new Uint8Array(buffer, rgbOffset, n * 3), quality: new Float32Array(buffer, qOffset, n) };
  }
  if (magic !== 'LBM2' || bytes.length !== 40 + n * 10) throw new Error('Invalid quantized pointcloud');
  const low = [0, 1, 2].map(i => view.getFloat32(8 + i * 4, true));
  const span = [0, 1, 2].map(i => view.getFloat32(20 + i * 4, true));
  const qLow = view.getFloat32(32, true), qSpan = view.getFloat32(36, true);
  const xyz = new Float32Array(n * 3), quality = new Float32Array(n);
  for (let i = 0; i < n * 3; i++) xyz[i] = low[i % 3] + view.getUint16(40 + i * 2, true) / 65535 * span[i % 3];
  for (let i = 0; i < n; i++) quality[i] = qLow + bytes[40 + n * 9 + i] / 255 * qSpan;
  return { n, xyz, rgb: new Uint8Array(buffer, 40 + n * 6, n * 3), quality };
}
