import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { CertificationService, CertificationInput } from '../services/certification.service';
import { successResponse } from '../utils/apiResponse';

/** Zod has already validated and coerced these by the time the handler runs. */
function toInput(body: Record<string, unknown>): CertificationInput {
  return {
    name: body.name as string,
    issuer: body.issuer as string,
    credentialId: (body.credentialId as string | undefined) ?? null,
    credentialUrl: (body.credentialUrl as string | undefined) ?? null,
    issueDate: (body.issueDate as Date | undefined) ?? null
  };
}

export class CertificationController {
  static getCertifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const certifications = await CertificationService.list(req.user!.id);
      return successResponse(res, 200, 'Certifications retrieved successfully', { certifications });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Adds a certification.
   *
   * `promotedSkills` reports which skills moved up the evidence ladder as a
   * result, so the client can explain the change rather than leave the user to
   * notice their skill list quietly differing.
   */
  static addCertification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await CertificationService.create(req.user!.id, toInput(req.body));
      return successResponse(res, 201, 'Certification added successfully', result);
    } catch (error) {
      next(error);
    }
  };

  static updateCertification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await CertificationService.update(req.user!.id, req.params.id, toInput(req.body));
      return successResponse(res, 200, 'Certification updated successfully', result);
    } catch (error) {
      next(error);
    }
  };

  static deleteCertification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await CertificationService.remove(req.user!.id, req.params.id);
      return successResponse(res, 200, 'Certification removed successfully');
    } catch (error) {
      next(error);
    }
  };
}
