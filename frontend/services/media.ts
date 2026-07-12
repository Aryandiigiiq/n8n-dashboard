import apiClient from "./api";

export interface MediaItem {
  id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  url: string;
  alt_text?: string;
  created_at: string;
}

export const mediaService = {
  async getGallery(): Promise<MediaItem[]> {
    const response = await apiClient.get<MediaItem[]>("/media");
    return response.data;
  },

  async upload(file: File): Promise<MediaItem> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<MediaItem>("/media", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async updateAltText(id: number, altText: string): Promise<MediaItem> {
    const response = await apiClient.patch<MediaItem>(`/media/${id}/alt-text`, {
      alt_text: altText,
    });
    return response.data;
  },

  async deleteMedia(id: number): Promise<void> {
    await apiClient.delete(`/media/${id}`);
  },
};