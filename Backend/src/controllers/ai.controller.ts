import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AiService } from '../services/ai.service';
import { successResponse } from '../utils/apiResponse';

export class AiController {
  /**
   * Get AI-generated engineering insights, grounded in the user's real
   * repository analyses.
   */
  static getInsights = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const result = await AiService.generateInsights(user.id);
      return successResponse(res, 200, 'AI insights retrieved', result);
    } catch (error) {
      next(error);
    }
  };
}
