import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { CareerReadinessService } from '../services/careerReadiness.service';
import { successResponse } from '../utils/apiResponse';

export class CareerReadinessController {
  /**
   * Readiness against every defined role, highest first.
   *
   * Computed on read rather than stored: a persisted score would go stale the
   * moment the next analysis completes, and a stale score shown as current is
   * exactly the unearned claim this product avoids.
   */
  static getReadiness = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const readiness = await CareerReadinessService.getReadiness(req.user!.id);
      return successResponse(res, 200, 'Career readiness computed successfully', { readiness });
    } catch (error) {
      next(error);
    }
  };
}
