import type { BaseAppender, BaseLog, ConfigResponse, Session, DeviceInfo, OsInfo, AppVersionInfo, VersionInfo, RequestContext } from '@shipbook/core';
import { Severity, SeverityUtil, InnerLog, connectionClient, HttpMethod, CORE_VERSION, Platform } from '@shipbook/core';
import { PLATFORM_VERSION } from '../generated/version';
import { requestContext } from '../context/request-context';
import { storage } from '../adapters/storage';
import { randomUUID } from 'crypto';
import * as os from 'os';

const MACHINE_UDID_KEY = 'machine_udid';
const SESSION_LIST_KEY = 'session_list';

export interface SBCloudAppenderDeps {
  appVersion?: string;
  getToken: () => string | undefined;
}

/**
 * Node.js cloud appender — registered as 'SBCloudAppender' so server config
 * (which references that name) activates this appender via appenderFactory.
 *
 * Storage-primary: there is no in-memory map of pending Sessions. The filesystem
 * (via the storage adapter) holds the working state, just like iOS's CloudQueue.log.
 * `persistedSessions` is a runtime index of IDs we've already written to disk so
 * push() can skip redundant descriptor writes for an already-known session.
 */
export class SBCloudAppender implements BaseAppender {
  name: string;

  private persistedSessions = new Set<string>();
  private timer?: ReturnType<typeof setTimeout>;
  private maxTime = 3;  // seconds
  private flushSeverity = Severity.Verbose;
  private flushSize = 1000;
  // One background session per process lifecycle — id + start time created together,
  // so any push that falls back to this context describes the same logical entity.
  private backgroundContext: RequestContext = {
    sessionId: randomUUID(),
    startTime: new Date(),
    isBackground: true,
    metadata: { type: 'background' }
  };

  private deviceInfo: DeviceInfo;
  private osInfo: OsInfo;
  private appInfo: AppVersionInfo;
  private sdkInfo: VersionInfo;

  private static _deps: SBCloudAppenderDeps;
  private getToken: () => string | undefined;

  static setDeps(deps: SBCloudAppenderDeps): void {
    SBCloudAppender._deps = deps;
  }

  constructor(name: string, config?: ConfigResponse) {
    this.name = name;
    this.getToken = SBCloudAppender._deps.getToken;
    this.deviceInfo = {
      udid: randomUUID(),  // placeholder, replaced by initMachineUdid if storage has one
      os: Platform.NODE,
      deviceName: os.hostname()
    };
    this.osInfo = { name: os.platform(), version: os.release() };
    this.appInfo = { version: SBCloudAppender._deps.appVersion };
    this.sdkInfo = { version: `core:${CORE_VERSION}/node:${PLATFORM_VERSION}` };
    this.update(config);
    this.restoreFromStorage();
    this.initMachineUdid();
  }

  private async initMachineUdid(): Promise<void> {
    const stored = await storage.getItem(MACHINE_UDID_KEY);
    if (stored) {
      this.deviceInfo.udid = stored;
    } else {
      await storage.setItem(MACHINE_UDID_KEY, this.deviceInfo.udid);
    }
  }

  async push(log: BaseLog): Promise<void> {
    InnerLog.d('push() called');
    const ctx = requestContext.get() ?? this.backgroundContext;

    await this.ensureSession(ctx);

    const logWithTrace = { ...log, traceId: ctx.traceId };
    await storage.pushArrayObj(`session_logs_${ctx.sessionId}`, { type: 'log', data: logWithTrace });

    this.scheduleFlush(log);
  }

  // Without this, sessions whose logs all fall below flushSeverity never reach the server, so stats compute against only error-bearing sessions.
  async ensureSession(ctx: RequestContext): Promise<void> {
    if (this.persistedSessions.has(ctx.sessionId)) return;
    // Add to the in-memory index BEFORE the await so concurrent calls for the same sessionId skip persistence too — the Set is single-threaded within the JS event loop.
    this.persistedSessions.add(ctx.sessionId);

    const descriptor: Omit<Session, 'logs'> = {
      sessionId: ctx.sessionId,
      userInfo: ctx.user,
      metadata: ctx.metadata || { type: 'background' },
      isBackground: ctx.isBackground ?? true,
      jobName: ctx.jobName,
      time: ctx.startTime.toISOString(),
      platform: Platform.NODE,
      deviceInfo: this.deviceInfo,
      os: this.osInfo,
      appInfo: this.appInfo,
      sdkInfo: this.sdkInfo
    };

    try {
      await storage.setObj(`session_${ctx.sessionId}`, descriptor);
      await storage.setObj(SESSION_LIST_KEY, [...this.persistedSessions]);
    } catch (error) {
      InnerLog.e('Failed to persist session:', error);
    }
  }

  private scheduleFlush(log: BaseLog): void {
    // Flush immediately only for high-severity logs (Warning, Error) so we don't flood send() on every push
    const logSeverityValue = 'severity' in log ? SeverityUtil.value((log as any).severity) : 0;
    const warningValue = SeverityUtil.value(Severity.Warning);
    if (logSeverityValue <= warningValue) {
      this.flush();
      return;
    }

    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush();
        this.timer = undefined;
      }, this.maxTime * 1000);
    }
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.send();
  }

  private async restoreFromStorage(): Promise<void> {
    try {
      const sessionList = await storage.getObj<string[]>(SESSION_LIST_KEY);
      if (!sessionList?.length) return;
      sessionList.forEach(id => this.persistedSessions.add(id));
      this.scheduleFlush({} as BaseLog);
    } catch (error) {
      InnerLog.e('Failed to restore from storage:', error);
    }
  }

  private async send(): Promise<void> {
    InnerLog.d('send() called');
    if (!this.getToken()) {
      InnerLog.d('No auth token yet, cannot send logs');
      return;
    }
    if (this.persistedSessions.size === 0) {
      InnerLog.d('No sessions to send');
      return;
    }
    InnerLog.d('Sending ' + this.persistedSessions.size + ' sessions');

    // Snapshot + clear atomically before any await — concurrent pushes after this point
    // build a fresh set of pending sessions for the next flush.
    const idsToSend = [...this.persistedSessions];
    this.persistedSessions.clear();
    await storage.setObj(SESSION_LIST_KEY, []);

    const sessions: Session[] = [];
    for (const id of idsToSend) {
      const descriptor = await storage.getObj<Omit<Session, 'logs'>>(`session_${id}`);
      const logsData = await storage.popAllArrayObj(`session_logs_${id}`) as Array<{ type: string; data: BaseLog }>;
      if (descriptor) {
        sessions.push({ ...descriptor, logs: logsData.map(l => l.data) });
      }
      await storage.removeItem(`session_${id}`);
    }

    if (sessions.length === 0) return;

    try {
      const response = await connectionClient.request('sessions/ingest', { sessions }, HttpMethod.POST);
      if (response.ok) {
        InnerLog.i('Ingest succeeded: ' + response.status);
      } else {
        const text = await response.text();
        InnerLog.e('Ingest failed: ' + response.status + ' ' + text);
      }
    } catch (error) {
      InnerLog.e('Ingest error:', error);
    }
  }

  update(config?: ConfigResponse): void {
    if (!config) return;
    if (config.maxTime) this.maxTime = config.maxTime as number;
    if (config.flushSeverity) this.flushSeverity = Severity[config.flushSeverity as keyof typeof Severity];
    if (config.flushSize) this.flushSize = config.flushSize as number;
  }

  destructor(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.send();
  }
}
