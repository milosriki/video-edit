// Google Drive Service
// Uses the Google Identity Services SDK and Google API Client Library.

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

export interface MockDriveFile {
    id: string;
    name: string;
    mimeType: string;
    thumbnailLink: string;
    embedLink?: string;
    downloadUrl?: string;
}

const API_KEY = (import.meta as any).env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;
let accessToken: string | null = null;

export const googleDriveService = {
    // Initialize the Google API Client
    init: async () => {
        console.log("Initializing Google Drive Service...");
        console.log("API Key Present:", !!API_KEY);
        console.log("Client ID Present:", !!CLIENT_ID);
        if (CLIENT_ID) console.log("Client ID Prefix:", CLIENT_ID.substring(0, 15) + "...");

        if (!API_KEY || !CLIENT_ID) {
            console.warn("Google Drive API Key or Client ID is missing in environment variables.");
            return;
        }

        return new Promise<void>((resolve, reject) => {
            // Timeout to prevent hanging forever
            const timeout = setTimeout(() => {
                console.error("Google API initialization timed out.");
                reject(new Error("Google API initialization timed out. Check your internet connection or ad blockers."));
            }, 10000); // 10 seconds timeout

            const checkGapi = setInterval(() => {
                if (window.gapi) {
                    clearInterval(checkGapi);
                    console.log("gapi loaded. Loading client...");
                    window.gapi.load('client', async () => {
                        try {
                            console.log("Initializing gapi client...");
                            await window.gapi.client.init({
                                apiKey: API_KEY,
                                discoveryDocs: [DISCOVERY_DOC],
                            });
                            gapiInited = true;
                            console.log("gapi client initialized.");
                            if (gisInited) {
                                clearTimeout(timeout);
                                resolve();
                            }
                        } catch (err) {
                            console.error("gapi client init error:", err);
                            // If the error is "Invalid API Key", we should reject with a clearer message
                            if (err.result && err.result.error && err.result.error.code === 403) {
                                clearTimeout(timeout);
                                reject(new Error("Google Drive API is not enabled for this API Key. Please enable 'Google Drive API' in the Google Cloud Console for project 'ptd-fitness-demo'."));
                            } else {
                                clearTimeout(timeout);
                                reject(err);
                            }
                        }
                    });
                }
            }, 100);

            const checkGis = setInterval(() => {
                if (window.google) {
                    clearInterval(checkGis);
                    console.log("google (GIS) loaded. Initializing token client...");
                    try {
                        tokenClient = window.google.accounts.oauth2.initTokenClient({
                            client_id: CLIENT_ID,
                            scope: SCOPES,
                            callback: (resp: any) => {
                                if (resp.error !== undefined) {
                                    throw (resp);
                                }
                                accessToken = resp.access_token;
                                console.log("Access Token received.");
                            },
                        });
                        gisInited = true;
                        console.log("GIS initialized.");
                        if (gapiInited) {
                            clearTimeout(timeout);
                            resolve();
                        }
                    } catch (err) {
                        console.error("GIS init error:", err);
                        clearTimeout(timeout);
                        reject(err);
                    }
                }
            }, 100);
        });
    },

    // Trigger the sign-in flow
    signIn: async (): Promise<{ name: string; email: string }> => {
        if (!API_KEY || !CLIENT_ID) {
            throw new Error("Configuration Error: Google API Key or Client ID is missing. Please check your .env.local file.");
        }

        if (!gapiInited || !gisInited) {
            console.log("Initializing Google APIs...");
            await googleDriveService.init();
        }

        return new Promise((resolve, reject) => {
            try {
                tokenClient.callback = async (resp: any) => {
                    if (resp.error) {
                        console.error("Google Sign-In Error:", resp);
                        reject(resp);
                        return;
                    }
                    accessToken = resp.access_token;
                    console.log("Google Sign-In Successful. Token received.");
                    resolve({ name: 'Google User', email: 'user@gmail.com' });
                };
                
                if (accessToken === null) {
                    tokenClient.requestAccessToken({prompt: 'consent'});
                } else {
                    tokenClient.requestAccessToken({prompt: ''});
                }
            } catch (err) {
                console.error("Sign-In Exception:", err);
                reject(err);
            }
        });
    },

    // List video files from Drive
    listFiles: async (): Promise<MockDriveFile[]> => {
        if (!accessToken) throw new Error("Not authenticated. Please sign in first.");

        try {
            console.log("Fetching files from Google Drive...");
            const response = await window.gapi.client.drive.files.list({
                'pageSize': 20,
                'fields': "nextPageToken, files(id, name, mimeType, thumbnailLink, webContentLink, videoMediaMetadata)",
                'q': "mimeType contains 'video/' and trashed = false"
            });
            
            const files = response.result.files;
            console.log(`Found ${files?.length || 0} video files.`);
            
            if (!files || files.length === 0) {
                return [];
            }

            return files.map((file: any) => ({
                id: file.id,
                name: file.name,
                mimeType: file.mimeType,
                thumbnailLink: file.thumbnailLink || 'https://placehold.co/160x90/1a202c/9ca3af?text=No+Thumbnail',
                downloadUrl: file.webContentLink,
                duration: file.videoMediaMetadata?.durationMillis ? (file.videoMediaMetadata.durationMillis / 1000) + 's' : undefined
            }));
        } catch (err: any) {
            console.error("Error listing files from Drive:", err);
            if (err.result && err.result.error) {
                throw new Error(`Drive API Error: ${err.result.error.message}`);
            }
            throw err;
        }
    },

    // Download a file from Drive
    downloadFile: async (file: MockDriveFile): Promise<File> => {
        if (!accessToken) throw new Error("Not authenticated");

        // We need to fetch the file content using the access token
        // The webContentLink might require a redirect or cookies, so using the API to get media is safer for processing
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }

        const blob = await response.blob();
        return new File([blob], file.name, { type: file.mimeType });
    },
};
