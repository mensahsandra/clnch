/**
 * Audio utilities for recording and processing
 */

export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately, we just needed to request permission
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

export function createAudioContext(): AudioContext {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioContext;
}

export async function getAudioStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
}

export function createMediaRecorder(
  stream: MediaStream,
  onDataAvailable: (data: Blob) => void,
  onStop?: () => void
): MediaRecorder {
  const recorder = new MediaRecorder(stream);

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      onDataAvailable(event.data);
    }
  };

  if (onStop) {
    recorder.onstop = onStop;
  }

  return recorder;
}

export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to ArrayBuffer'));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

export function playAudio(arrayBuffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const audioContext = createAudioContext();
    audioContext.decodeAudioData(
      arrayBuffer,
      (audioBuffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => resolve();
        source.start();
      },
      (error) => reject(new Error(`Failed to decode audio: ${error}`))
    );
  });
}
