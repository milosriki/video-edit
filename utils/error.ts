
/**
 * PTD Global Error Resilience Utility
 * Maps technical exceptions to actionable human directives.
 */
export type ErrorCategory = 'DRIVE_AUTH' | 'DRIVE_IO' | 'GEMINI_THROTTLED' | 'GEMINI_LOGIC' | 'FFMPEG_MEMORY' | 'FFMPEG_ENCODE' | 'NETWORK' | 'UNKNOWN';

export interface ActionableError {
    category: ErrorCategory;
    message: string;
    actionLabel?: string;
    technicalDetails?: string;
}

export const mapErrorToAction = (error: unknown): ActionableError => {
    const err = error instanceof Error ? error : new Error(String(error));
    const msg = err.message.toLowerCase();

    // 1. Google Drive Specifics
    if (msg.includes("unauthorized") || msg.includes("token") || msg.includes("401")) {
        return {
            category: 'DRIVE_AUTH',
            message: "Cloud Credentials Expired. Your Drive connection has timed out.",
            actionLabel: "RE-AUTHENTICATE DRIVE"
        };
    }
    if (msg.includes("requested entity was not found") || msg.includes("404")) {
        return {
            category: 'DRIVE_IO',
            message: "Target Asset Missing. A file in your Drive folder may have been moved or deleted.",
            actionLabel: "REFRESH FOLDER SCAN"
        };
    }

    // 2. Gemini API / Model Specifics
    if (msg.includes("429") || msg.includes("quota") || msg.includes("rate limit")) {
        return {
            category: 'GEMINI_THROTTLED',
            message: "Intelligence Quota Exceeded. You've reached the Gemini 3 Pro burst limit.",
            actionLabel: "WAIT 30 SECONDS"
        };
    }
    if (msg.includes("parse") || msg.includes("format") || msg.includes("unexpected token")) {
        return {
            category: 'GEMINI_LOGIC',
            message: "Neural Blueprint Corrupted. The model generated an invalid ad structure.",
            actionLabel: "RE-RUN ARCHITECT"
        };
    }

    // 3. Browser / FFmpeg / Hardware Specifics
    if (msg.includes("memory") || msg.includes("buffer") || msg.includes("allocation")) {
        return {
            category: 'FFMPEG_MEMORY',
            message: "Browser Memory Exhausted. The high-bitrate video render exceeded Chrome's sandbox limits.",
            actionLabel: "USE SMALLER CLIPS"
        };
    }
    if (msg.includes("ffmpeg") || msg.includes("encoder") || msg.includes("filter")) {
        return {
            category: 'FFMPEG_ENCODE',
            message: "Master Render Collision. FFmpeg kernel failed to stitch the neural layers.",
            actionLabel: "RE-INITIALIZE WASM"
        };
    }

    // 4. Network
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("cors")) {
        return {
            category: 'NETWORK',
            message: "Signal Interrupted. Check your local connection to the PTD Core.",
            actionLabel: "CHECK WIFI"
        };
    }

    return {
        category: 'UNKNOWN',
        message: "An unspecified anomaly occurred in the intelligence mesh.",
        technicalDetails: err.message
    };
};

export const formatErrorMessage = (error: unknown): string => {
    return mapErrorToAction(error).message;
};
