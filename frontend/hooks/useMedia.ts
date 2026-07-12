import { useState, useCallback } from "react";
import { mediaService } from "@/services/media";

export function useMedia() {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = useCallback(async (file: File): Promise<string> => {
        setUploading(true);
        setError(null);
        try {
            const mediaItem = await mediaService.upload(file);
            return mediaItem.url;
            // Note: if your MediaItem schema uses a different string field like 'id', use mediaItem.id instead
        } catch (err: any) {
            const msg = err.message || "Failed to upload file";
            setError(msg);
            throw new Error(msg);
        } finally {
            setUploading(false);
        }
    }, []);

    return {
        uploadFile,
        uploading,
        error,
    };
}
