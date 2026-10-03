import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { ResumeService } from '../services/resume.service';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

export class ResumeController {
  /** The user's resume summary, or null when none has been uploaded. */
  static getResume = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const resume = await ResumeService.get(req.user!.id);
      return successResponse(res, 200, 'Resume retrieved successfully', { resume });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload a resume, replacing any previous one.
   *
   * A parse failure is reported in the body rather than as an error status: the
   * upload itself succeeded, the file is stored, and only the text extraction
   * did not work — which the user may well want to fix by re-exporting.
   */
  static uploadResume = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const file = (req as unknown as { file?: Express.Multer.File }).file;
      if (!file) {
        throw AppError.badRequest('No file was uploaded. Attach a PDF in the "resume" field.');
      }

      const result = await ResumeService.upload(req.user!.id, {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        buffer: file.buffer
      });

      return successResponse(res, 201, 'Resume uploaded successfully', result);
    } catch (error) {
      next(error);
    }
  };

  /** Stream the stored PDF back to its owner. */
  static downloadResume = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { absolutePath, fileName } = await ResumeService.locate(req.user!.id);
      return res.download(absolutePath, fileName);
    } catch (error) {
      next(error);
    }
  };

  static deleteResume = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await ResumeService.remove(req.user!.id);
      return successResponse(res, 200, 'Resume removed successfully');
    } catch (error) {
      next(error);
    }
  };
}
