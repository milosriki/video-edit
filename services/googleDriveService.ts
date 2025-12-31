
// PTD Google Drive Bridge - Production Implementation
export interface DriveItem {
    id: string;
    name: string;
    mimeType: string;
    thumbnailLink: string;
    isFolder: boolean;
}

export const googleDriveService = {
    getAccessToken: (): string | null => {
        const saved = localStorage.getItem('ptd_connections');
        if (!saved) return null;
        try {
            const driveConn = JSON.parse(saved).find((c: any) => c.id === 'drive' && c.connected);
            return driveConn?.apiKey || null;
        } catch (e) {
            return null;
        }
    },

    listItems: async (folderId: string = 'root'): Promise<DriveItem[]> => {
        const token = googleDriveService.getAccessToken();
        if (!token) throw new Error("401 Unauthorized: Drive connection offline.");

        const query = `'${folderId}' in parents and (mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'video/') and trashed = false`;
        
        try {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files?pageSize=50&fields=files(id,name,mimeType,thumbnailLink,hasThumbnail)&q=${encodeURIComponent(query)}&orderBy=folder,name`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(`${response.status}: ${err.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.files.map((f: any) => ({
                id: f.id,
                name: f.name,
                mimeType: f.mimeType,
                isFolder: f.mimeType === 'application/vnd.google-apps.folder',
                thumbnailLink: f.thumbnailLink || (f.mimeType === 'application/vnd.google-apps.folder' ? '' : `https://placehold.co/160x90/1a202c/9ca3af?text=${encodeURIComponent(f.name)}`)
            }));
        } catch (e) {
            console.error("Drive IO Failure", e);
            throw e;
        }
    },

    listVideosInFolder: async (folderId: string): Promise<DriveItem[]> => {
        const token = googleDriveService.getAccessToken();
        if (!token) throw new Error("401 Unauthorized");

        const query = `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`;
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,mimeType,thumbnailLink)&q=${encodeURIComponent(query)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Drive Query Failed: ${response.status}`);
        const data = await response.json();
        return data.files.map((f: any) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            isFolder: false,
            thumbnailLink: f.thumbnailLink || ""
        }));
    },

    downloadFile: async (fileId: string, name: string, mimeType: string): Promise<File> => {
        const token = googleDriveService.getAccessToken();
        if (!token) throw new Error("401 Unauthorized");

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 403) throw new Error("403 Forbidden: Bandwidth limit or restricted access.");
        if (!response.ok) throw new Error(`Failed to stream binary (${response.status})`);

        const blob = await response.blob();
        return new File([blob], name, { type: mimeType });
    },
};
