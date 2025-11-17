/**
 * Formats an error object into a user-friendly string.
 * @param error The error object, which can be of any type.
 * @returns A string suitable for display in the UI.
 */
export const formatErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        const message = error.message;
        const lowerMessage = message.toLowerCase();

        // Allow specific, user-friendly messages from the app to pass through
        if (message.startsWith("No silent segments found") || message.startsWith("No segments found matching")) {
            return message;
        }

        if (lowerMessage.includes("api key")) {
            return "The Gemini API key is not configured. Please contact the administrator.";
        }
        
        if (lowerMessage.includes("format") || lowerMessage.includes("parse")) {
            return "The AI provided a response in an unexpected format. This can be a temporary issue. Please try your request again.";
        }

        if (lowerMessage.includes("failed to fetch")) {
            return "Could not connect to the API. Please check your internet connection and try again.";
        }
        
        if (lowerMessage.includes("ffmpeg") || lowerMessage.includes("processing")) {
             return "Video processing failed. This might be due to an unsupported video format or a browser memory limitation. Please try again with a smaller video.";
        }
        
        if (lowerMessage.includes("load video")) {
            return "Could not load the video file. It might be corrupted or in an unsupported format.";
        }

        // Log the original error for debugging purposes
        console.error("Unhandled Application Error:", error);
        
        // Return a generic but helpful message for all other cases
        return "An unexpected error occurred. Please try again. If the problem persists, the specific error has been logged for review.";
    }
    
    console.error("Unhandled Non-Error Thrown:", error);
    return "An unknown error occurred. Please try again.";
};