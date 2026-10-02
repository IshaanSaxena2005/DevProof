import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { CourseService, CourseInput } from '../services/course.service';
import { successResponse } from '../utils/apiResponse';

/** Zod has already validated and coerced these by the time the handler runs. */
function toInput(body: Record<string, unknown>): CourseInput {
  return {
    title: body.title as string,
    platform: body.platform as string,
    isCompleted: Boolean(body.isCompleted),
    certificateUrl: (body.certificateUrl as string | undefined) ?? null,
    completedAt: (body.completedAt as Date | undefined) ?? null,
    learnedSkills: (body.learnedSkills as string[] | undefined) ?? []
  };
}

export class CourseController {
  static getCourses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const courses = await CourseService.list(req.user!.id);
      return successResponse(res, 200, 'Courses retrieved successfully', { courses });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Adds a course.
   *
   * `promotedSkills` reports which skills moved to LEARNED as a result, so the
   * client can explain the change rather than leave the user to notice their
   * skill list quietly differing.
   */
  static addCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await CourseService.create(req.user!.id, toInput(req.body));
      return successResponse(res, 201, 'Course added successfully', result);
    } catch (error) {
      next(error);
    }
  };

  static updateCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await CourseService.update(req.user!.id, req.params.id, toInput(req.body));
      return successResponse(res, 200, 'Course updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  static deleteCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await CourseService.remove(req.user!.id, req.params.id);
      return successResponse(res, 200, 'Course removed successfully');
    } catch (error) {
      next(error);
    }
  };
}
