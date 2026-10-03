import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { HackathonService, HackathonInput } from '../services/hackathon.service';
import { successResponse } from '../utils/apiResponse';

/** Zod has already validated and coerced these by the time the handler runs. */
function toInput(body: Record<string, unknown>): HackathonInput {
  return {
    name: body.name as string,
    organizer: body.organizer as string,
    role: (body.role as string | undefined) ?? null,
    projectName: (body.projectName as string | undefined) ?? null,
    projectUrl: (body.projectUrl as string | undefined) ?? null,
    result: (body.result as string | undefined) ?? null,
    teamSize: (body.teamSize as number | undefined) ?? null,
    heldAt: (body.heldAt as Date | undefined) ?? null,
    technologies: (body.technologies as string[] | undefined) ?? []
  };
}

export class HackathonController {
  static getHackathons = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const hackathons = await HackathonService.list(req.user!.id);
      return successResponse(res, 200, 'Hackathons retrieved successfully', { hackathons });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Adds a hackathon.
   *
   * `recordedSkills` names technologies newly created at CLAIMED. Nothing is
   * promoted — a hackathon is self-reported and evidences nothing on its own.
   */
  static addHackathon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await HackathonService.create(req.user!.id, toInput(req.body));
      return successResponse(res, 201, 'Hackathon added successfully', result);
    } catch (error) {
      next(error);
    }
  };

  static updateHackathon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await HackathonService.update(req.user!.id, req.params.id, toInput(req.body));
      return successResponse(res, 200, 'Hackathon updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  static deleteHackathon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await HackathonService.remove(req.user!.id, req.params.id);
      return successResponse(res, 200, 'Hackathon removed successfully');
    } catch (error) {
      next(error);
    }
  };
}
