/**
 * Extracts a single frame from a video file to be used as a thumbnail.
 * @param videoFile The video file.
 * @returns A promise that resolves to a base64 encoded thumbnail image (with the data:image/jpeg;base64, prefix).
 */
export const generateVideoThumbnail = (videoFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            return reject(new Error('Failed to get canvas context.'));
        }

        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.src = URL.createObjectURL(videoFile);

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            // Seek to 1 second or beginning for a representative frame
            video.currentTime = Math.min(1, video.duration);
        };

        video.onseeked = () => {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            URL.revokeObjectURL(video.src);
            resolve(dataUrl);
        };

        video.onerror = (e) => {
            URL.revokeObjectURL(video.src);
            reject(new Error('Could not load video for thumbnail generation.'));
        };
    });
};


/**
 * Extracts a specified number of frames from a video file.
 * @param videoFile The video file to process.
 * @param frameCount The number of frames to extract.
 * @returns A promise that resolves to an array of base64 encoded frame images (without the data:image/jpeg;base64, prefix).
 */
export const extractFramesFromVideo = (
  videoFile: File,
  frameCount: number = 10
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const frames: string[] = [];

    if (!context) {
      return reject(new Error('Failed to get canvas context.'));
    }

    // Mute video to prevent any unexpected sound playback
    video.muted = true;
    video.playsInline = true;

    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);
    
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      // Ensure we handle very short videos
      const interval = duration > 0 ? duration / frameCount : 0;
      let currentTime = 0;
      let framesCaptured = 0;

      const captureFrame = () => {
        // Ensure currentTime does not exceed duration
        video.currentTime = Math.min(currentTime, duration);
      };

      video.onseeked = () => {
        // Use a short timeout to allow the frame to render properly before capturing
        setTimeout(() => {
          if (framesCaptured >= frameCount) {
            return; // Already done
          }

          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          // Using 'image/jpeg' for smaller file size.
          const frameDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          frames.push(frameDataUrl.split(',')[1]); // Push only the base64 part
          framesCaptured++;
          
          if (framesCaptured < frameCount) {
            currentTime += interval;
            captureFrame();
          } else {
            URL.revokeObjectURL(video.src);
            resolve(frames);
          }
        }, 100); // 100ms delay for frame render
      };

      video.onerror = (e) => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Error processing video frames.'));
      };
      
      captureFrame();
    };

    video.onerror = (e) => {
      reject(new Error('Could not load video metadata. Please check the video file.'));
    };
  });
};