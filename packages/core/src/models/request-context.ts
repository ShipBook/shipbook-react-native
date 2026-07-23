import type User from './user';
import type { SessionLink } from './session';

/**
 * Context for a request or background job.
 * Captured by middleware (HTTP) or runInContext (background).
 */
export interface RequestContext {
  sessionId: string;       // express-session ID, job ID, or generated UUID
  traceId?: string;        // Optional - only for HTTP requests (x-request-id)
  callerSession?: SessionLink;  // Cross-app link from the x-shipbook-session header
  user?: User;             // Full user object (userId, userName, email, etc.)
  metadata?: Record<string, unknown>;  // method, path, ip, etc.
  startTime: Date;
  isBackground?: boolean;  // True for background jobs, false for HTTP requests
  jobName?: string;        // Name of the background job (for filtering/searching)
}
