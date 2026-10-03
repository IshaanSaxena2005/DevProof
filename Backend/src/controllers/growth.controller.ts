import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { GrowthService } from '../services/growth.service';
import { successResponse } from '../utils/apiResponse';

export class GrowthController {
  /**
   * The authenticated user's measured history.
   *
   * Empty arrays are a valid, meaningful answer: a user who has analyzed
   * nothing has no history, which is different from having a flat one.
   */
  static getHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const history = await GrowthService.getHistory(req.user!.id);
      return successResponse(res, 200, 'Growth history retrieved successfully', { history });
    } catch (error) {
      next(error);
    }
  };
}
