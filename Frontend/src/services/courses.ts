import { api } from "../lib/api.mts";
import type {
  CourseInput,
  CourseMutationResponse,
  CoursesResponse,
} from "../lib/types";

/**
 * Client for the existing /courses backend (list, add, update, remove).
 * Mirrors the certifications service pattern; update uses PATCH as the
 * backend route defines, and both mutations return promotedSkills so the UI
 * can explain which recorded skills moved up the evidence ladder.
 */
export const coursesService = {
  async list(): Promise<CoursesResponse> {
    return api.get<CoursesResponse>("/courses");
  },

  async add(input: CourseInput): Promise<CourseMutationResponse> {
    return api.post<CourseMutationResponse>("/courses", input);
  },

  async update(id: string, input: CourseInput): Promise<CourseMutationResponse> {
    return api.patch<CourseMutationResponse>(`/courses/${id}`, input);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/courses/${id}`);
  },
};
