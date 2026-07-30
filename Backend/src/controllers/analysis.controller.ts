import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AnalysisEngineService } from '../services/analysisEngine.service';
import { prisma } from '../config/database';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { AnalysisStatus } from '@prisma/client';

export class AnalysisController {
  /**
   * Trigger full analysis run on a repository
   */
  static triggerAnalysis = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { repositoryId } = req.body;

      if (!repositoryId) {
        throw AppError.badRequest('repositoryId is required');
      }

      const repository = await prisma.repository.findFirst({
        where: { id: repositoryId, userId: user.id }
      });

      if (!repository) {
        throw AppError.notFound('Repository not found or access denied');
      }

      const accessToken = user.githubAccount?.accessToken;

      // Run static analysis engine
      const result = await AnalysisEngineService.runAnalysis(
        repository.owner,
        repository.name,
        repository.defaultBranch,
        accessToken
      );

      // Save RepositoryAnalysis, Metrics, and Findings in database inside transaction
      const analysis = await prisma.$transaction(async (tx) => {
        const analysisRecord = await tx.repositoryAnalysis.create({
          data: {
            repositoryId: repository.id,
            userId: user.id,
            status: AnalysisStatus.COMPLETED,
            overallScore: result.overallScore,
            healthStatus: result.healthStatus,
            rawResults: result.rawSummary as any,
            analyzedAt: new Date(),
            metrics: {
              create: result.metrics.map((m) => ({
                category: m.category,
                name: m.name,
                score: m.score,
                detail: m.detail
              }))
            },
            findings: {
              create: result.findings.map((f) => ({
                severity: f.severity,
                category: f.category,
                title: f.title,
                description: f.description,
                filePath: f.filePath,
                lineNumber: f.lineNumber,
                snippet: f.snippet,
                recommendation: f.recommendation
              }))
            }
          },
          include: {
            metrics: true,
            findings: true
          }
        });

        // Store analysis history snapshot
        await tx.analysisHistory.create({
          data: {
            repositoryId: repository.id,
            userId: user.id,
            score: result.overallScore,
            summary: `Health: ${result.healthStatus}, ${result.metrics.length} metrics evaluated, ${result.findings.length} findings recorded.`
          }
        });

        return analysisRecord;
      });

      return successResponse(res, 200, 'Repository analysis completed successfully', { analysis });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get specific analysis result by ID
   */
  static getAnalysisById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { id } = req.params;

      const analysis = await prisma.repositoryAnalysis.findFirst({
        where: { id, userId: user.id },
        include: {
          repository: true,
          metrics: true,
          findings: true
        }
      });

      if (!analysis) {
        throw AppError.notFound('Analysis record not found');
      }

      return successResponse(res, 200, 'Analysis details retrieved successfully', { analysis });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get latest analysis result for a repository
   */
  static getLatestRepoAnalysis = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { repositoryId } = req.params;

      const analysis = await prisma.repositoryAnalysis.findFirst({
        where: { repositoryId, userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          metrics: true,
          findings: true
        }
      });

      if (!analysis) {
        throw AppError.notFound('No analysis found for this repository');
      }

      return successResponse(res, 200, 'Latest repository analysis retrieved', { analysis });
    } catch (error) {
      next(error);
    }
  };
}
