import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { CodingProfileService, SupportedPlatform } from '../services/codingProfile.service';
import { successResponse } from '../utils/apiResponse';

export class CodingProfileController {
  /** Every coding profile the authenticated user has linked. */
  static getProfiles = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const profiles = await CodingProfileService.list(req.user!.id);
      return successResponse(res, 200, 'Coding profiles retrieved successfully', { profiles });
    } catch (error) {
      next(error);
    }
  };

  /** Link a platform account and populate it from that platform in one step. */
  static connectProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { platform, handle } = req.body as { platform: SupportedPlatform; handle: string };
      const profile = await CodingProfileService.connect(req.user!.id, platform, handle);
      return successResponse(res, 201, 'Coding profile connected successfully', { profile });
    } catch (error) {
      next(error);
    }
  };

  /** Refresh a linked profile using its stored handle. */
  static syncProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const platform = req.params.platform as SupportedPlatform;
      const profile = await CodingProfileService.sync(req.user!.id, platform);
      return successResponse(res, 200, 'Coding profile synced successfully', { profile });
    } catch (error) {
      next(error);
    }
  };

  static disconnectProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const platform = req.params.platform as SupportedPlatform;
      await CodingProfileService.disconnect(req.user!.id, platform);
      return successResponse(res, 200, 'Coding profile disconnected successfully');
    } catch (error) {
      next(error);
    }
  };
}
