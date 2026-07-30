import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Developer360Service } from '../services/developer360.service';
import { successResponse } from '../utils/apiResponse';

export class Developer360Controller {
  /**
   * Get 360-degree developer intelligence summary
   */
  static getOverview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const overview = await Developer360Service.getDeveloperOverview(user.id);
      return successResponse(res, 200, 'Developer 360 degree overview retrieved', { overview });
    } catch (error) {
      next(error);
    }
  };
}
