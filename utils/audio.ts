/**
 * Decodes a Base64 string into a Uint8Array.
 * This is a required step before processing raw audio data from the Gemini API.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encodes a Uint8Array into a Base64 string.
 * This is used for sending microphone audio data to the Gemini Live API.
 */
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts raw PCM audio data (as a Uint8Array) into an AudioBuffer
 * that can be played by the Web Audio API.
 * The Gemini API returns raw audio streams, not standard file formats like MP3 or WAV,
 * so this custom decoding is necessary.
 * @param data The raw PCM audio data.
 * @param ctx The AudioContext to use for creating the buffer.
 * @param sampleRate The sample rate of the audio (e.g., 24000 for Gemini TTS/Live).
 * @param numChannels The number of audio channels (typically 1 for mono).
 * @returns A promise that resolves to a playable AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // The API returns 16-bit PCM data.
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  
  // Create an empty AudioBuffer
  const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  // Separate the data into channels
  for (let c = 0; c < numChannels; c++) {
    const channelData = audioBuffer.getChannelData(c);
    let dataIndex = c;
    for (let i = 0; i < frameCount; i++) {
      // Convert 16-bit integer (Int16, -32768 to 32767) to 32-bit float (-1.0 to 1.0)
      channelData[i] = dataInt16[dataIndex] / 32768.0;
      dataIndex += numChannels;
    }
  }
  return audioBuffer;
}