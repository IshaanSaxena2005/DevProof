import { NextFunction, Request, Response } from 'express';
import { GitHubAppService } from '../services/githubApp.service';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';

type GitHubWebhookRequest = Request & {
  body: Buffer | string | Record<string, unknown>;
};

function parseWebhookBody(body: GitHubWebhookRequest['body']): Record<string, any> {
  if (Buffer.isBuffer(body)) {
    const text = body.toString('utf8');
    return text ? JSON.parse(text) : {};
  }

  if (typeof body === 'string') {
    return body ? JSON.parse(body) : {};
  }

  return body ?? {};
}

export class GitHubWebhookController {
  static receive = async (req: GitHubWebhookRequest, res: Response, next: NextFunction) => {
    try {
      const event = (req.header('x-github-event') || 'unknown').toLowerCase();
      const signature = req.header('x-hub-signature-256') || undefined;

      if (!GitHubAppService.verifyWebhookSignature(req.body as Buffer | string, signature)) {
        throw AppError.unauthorized('Invalid GitHub webhook signature.');
      }

      const payload = parseWebhookBody(req.body);

      if (event === 'ping') {
        return successResponse(res, 200, 'GitHub webhook ping received', {
          event,
          zen: payload.zen ?? null,
          hookId: payload.hook_id ?? null
        });
      }

      if (event === 'push') {
        return successResponse(res, 202, 'GitHub push event acknowledged', {
          event,
          repository: payload.repository?.full_name ?? null,
          ref: payload.ref ?? null,
          pusher: payload.pusher?.name ?? null,
          commitCount: Array.isArray(payload.commits) ? payload.commits.length : 0
        });
      }

      return successResponse(res, 202, `GitHub webhook event ${event} acknowledged`, {
        event,
        action: payload.action ?? null,
        repository: payload.repository?.full_name ?? null
      });
    } catch (error) {
      next(error);
    }
  };

  static status = async (_req: Request, res: Response) => {
    return successResponse(res, 200, 'GitHub webhook endpoint is live', {
      configured: GitHubAppService.isConfigured(),
      webhookSecretConfigured: Boolean(process.env.GITHUB_WEBHOOK_SECRET)
    });
  };
}
