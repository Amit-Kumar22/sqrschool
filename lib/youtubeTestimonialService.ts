import { api, type ApiEnvelope } from './api';
import { API_ENDPOINTS } from './config';

// ─── YouTube Testimonial service ────────────────────────────────────────────
// Dedicated service for the YouTube Testimonial Management endpoints. Every
// call is wrapped in the {statusCode, success, message, result} envelope.

export interface YoutubeTestimonial {
  id: number;
  videoTitle: string;
  videoUrl: string;
  isActive: boolean;
  createdAt: string;
}

export type YoutubeTestimonialPayload = Omit<YoutubeTestimonial, 'id' | 'createdAt'>;

/** Full list of testimonials — this endpoint isn't paginated, unlike infrastructure/chatbot. */
export const getYoutubeTestimonials = async (): Promise<YoutubeTestimonial[]> => {
  const response = await api.get<ApiEnvelope<YoutubeTestimonial[]>>(API_ENDPOINTS.YOUTUBE_TESTIMONIAL.LIST);
  return Array.isArray(response.data.result) ? response.data.result : [];
};

export const getYoutubeTestimonial = async (id: number): Promise<YoutubeTestimonial> => {
  const response = await api.get<ApiEnvelope<YoutubeTestimonial>>(API_ENDPOINTS.YOUTUBE_TESTIMONIAL.GET(id));
  return response.data.result;
};

export const createYoutubeTestimonial = async (data: YoutubeTestimonialPayload): Promise<YoutubeTestimonial> => {
  const response = await api.post<ApiEnvelope<YoutubeTestimonial>>(API_ENDPOINTS.YOUTUBE_TESTIMONIAL.CREATE, data);
  return response.data.result;
};

export const updateYoutubeTestimonial = async (
  id: number,
  data: YoutubeTestimonialPayload,
): Promise<YoutubeTestimonial> => {
  const response = await api.put<ApiEnvelope<YoutubeTestimonial>>(API_ENDPOINTS.YOUTUBE_TESTIMONIAL.UPDATE(id), {
    ...data,
    id,
  });
  return response.data.result;
};

export const deleteYoutubeTestimonial = async (id: number): Promise<void> => {
  await api.delete(API_ENDPOINTS.YOUTUBE_TESTIMONIAL.DELETE(id));
};
