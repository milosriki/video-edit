// Mock Google Drive Service
// In a real application, this would use the Google Drive API and OAuth2.
// For this environment, we simulate the flow with mock data.

export interface MockDriveFile {
    id: string;
    name: string;
    mimeType: string;
    thumbnailLink: string;
}

const mockFiles: MockDriveFile[] = [
    { id: '1', name: 'testimonial_sarah.mp4', mimeType: 'video/mp4', thumbnailLink: 'https://placehold.co/160x90/1a202c/9ca3af?text=Video+1' },
    { id: '2', name: 'gym_b-roll_01.mp4', mimeType: 'video/mp4', thumbnailLink: 'https://placehold.co/160x90/1a202c/9ca3af?text=Video+2' },
    { id: '3', name: 'trainer_intro_v2.mp4', mimeType: 'video/mp4', thumbnailLink: 'https://placehold.co/160x90/1a202c/9ca3af?text=Video+3' },
    { id: '4', name: 'workout_montage.mov', mimeType: 'video/quicktime', thumbnailLink: 'https://placehold.co/160x90/1a202c/9ca3af?text=Video+4' },
    { id: '5', name: 'client_progress_reel.mp4', mimeType: 'video/mp4', thumbnailLink: 'https://placehold.co/160x90/1a202c/9ca3af?text=Video+5' },
];

export const googleDriveService = {
    // Simulates the user signing in.
    signIn: async (): Promise<{ name: string; email: string }> => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        return { name: 'Demo User', email: 'demo@example.com' };
    },

    // Simulates listing video files from a folder.
    listFiles: async (): Promise<MockDriveFile[]> => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        return mockFiles;
    },

    // Simulates downloading a file from Drive and returns a File object.
    downloadFile: async (file: MockDriveFile): Promise<File> => {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate download time
        // Create a dummy blob to represent the video file content
        const dummyContent = new Uint8Array(1024 * 1024 * 5); // 5MB dummy file
        const blob = new Blob([dummyContent], { type: file.mimeType });
        return new File([blob], file.name, { type: file.mimeType });
    },
};