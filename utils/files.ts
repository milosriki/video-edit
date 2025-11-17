/**
 * Converts a File or Blob object to a Base64 encoded string.
 * @param file The file or blob to convert.
 * @returns A promise that resolves to the Base64 string (without the data URL prefix).
 */
export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Result looks like "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
        // We only want the part after the comma.
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as a Base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};