import { Response, NextFunction } from 'express';
import { SkillCategory } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { SkillService } from '../services/skill.service';
import { successResponse } from '../utils/apiResponse';

export class SkillController {
  /** All skills for the authenticated user, with the evidence behind each. */
  static getSkills = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const skills = await SkillService.listSkills(req.user!.id);
      return successResponse(res, 200, 'Skills retrieved successfully', { skills });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Rebuild evidenced skills from the caller's analyzed repositories.
   *
   * Returns the derivation summary alongside the resulting skills so the client
   * can render the new state without a second round trip.
   */
  static deriveSkills = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const summary = await SkillService.deriveSkills(userId);
      const skills = await SkillService.listSkills(userId);

      return successResponse(res, 200, 'Skills derived from repository evidence', { summary, skills });
    } catch (error) {
      next(error);
    }
  };

  /** Add a skill the user claims; recorded at the CLAIMED evidence level. */
  static addSkill = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, category } = req.body as { name: string; category?: SkillCategory };

      const skill = await SkillService.addClaimedSkill(
        req.user!.id,
        name,
        category ?? SkillCategory.GENERAL
      );

      return successResponse(res, 201, 'Skill added successfully', { skill });
    } catch (error) {
      next(error);
    }
  };

  static deleteSkill = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await SkillService.deleteSkill(req.user!.id, req.params.id);
      return successResponse(res, 200, 'Skill removed successfully');
    } catch (error) {
      next(error);
    }
  };
}
