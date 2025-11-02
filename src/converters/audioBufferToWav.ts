// TypeScript-native AudioBuffer → WAV (ArrayBuffer)
// Supports 16-bit PCM (default) and 32-bit float WAV.
export type WavBitDepth = 16 | 32;
export interface ToWavOptions {
  /** 16 = PCM int16, 32 = IEEE float32 */
  bitDepth?: WavBitDepth;
}
/**
 * Convert an AudioBuffer to a WAV file (ArrayBuffer).
 * @param buffer Web Audio API AudioBuffer
 * @param opts   { bitDepth: 16 | 32 } (default 16)
 */
export function audioBufferToWav(
  buffer: AudioBuffer,
  opts: ToWavOptions = {},
): ArrayBuffer {
  const bitDepth: WavBitDepth = opts.bitDepth ?? 16;
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  // Interleave channels
  const interleaved =
    numChannels === 1
      ? buffer.getChannelData(0)
      : interleave(
          Array.from({ length: numChannels }, (_, i) =>
            buffer.getChannelData(i),
          ),
        );

  // Encode samples
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = interleaved.length * bytesPerSample;

  // WAV header is 44 bytes (PCM/float)
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const wavBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(wavBuffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize - 8, true); // file size minus 'RIFF' and size field
  writeString(view, 8, "WAVE");

  // fmt  chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  const format = bitDepth === 32 ? 3 : 1; // 3 = IEEE float, 1 = PCM
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Write samples
  if (bitDepth === 32) {
    floatTo32BitPCM(view, 44, interleaved);
  } else {
    floatTo16BitPCM(view, 44, interleaved);
  }

  return wavBuffer;
}

function interleave(channels: Float32Array[]): Float32Array {
  const length = channels[0].length;
  const numChannels = channels.length;
  const result = new Float32Array(length * numChannels);
  let idx = 0;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      result[idx++] = channels[ch][i];
    }
  }
  return result;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
  let pos = offset;
  for (let i = 0; i < input.length; i++, pos += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    // scale to signed 16-bit
    view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

function floatTo32BitPCM(view: DataView, offset: number, input: Float32Array) {
  let pos = offset;
  for (let i = 0; i < input.length; i++, pos += 4) {
    view.setFloat32(pos, input[i], true);
  }
}
