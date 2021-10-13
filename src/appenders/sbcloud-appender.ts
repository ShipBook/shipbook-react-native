import InnerLog from "../inner-log";
import BaseLog, { LogType } from "../models/base-log";
import Exception from "../models/exception";
import Login from "../models/login";
import Message from "../models/message";
import { Severity, SeverityUtil } from "../models/severity";
import User from "../models/user";
import ConnectionClient, { HttpMethod } from "../networking/connection-client";
import SessionManager from "../networking/session-manager";
import storage from "../storage";
import { BaseAppender } from "./base-appender";


enum DataType {
  Token = 'token',
  Login = 'login',
  User = 'user'
}

interface StorageData{
  type: string;
  data: any;
}

interface SessionData {
  token?: string;
  login?: Login;
  logs: BaseLog[];
  user?: User;
}

const SESSION_DATA = 'session_data';
export default class SBCloudAppender implements BaseAppender {
  name: string;
  private maxTime = 3;
  private flushSeverity = Severity.Verbose;
  private flushSize = 1000;

  private flushQueue: BaseLog[] = [];
  private timer?:  NodeJS.Timeout;
  private hasLog: boolean = false;

  constructor(name: string, config?: ConfigResponse) {
    this.name = name;
    this.update(config);
  }

  update(config?: ConfigResponse): void {
    // throw new Error("Method not implemented.");
  }
  async push(log: BaseLog): Promise<void> {
    if (log.type == LogType.Message) {
      const message = await (<Message>log).getObj();
      this.flushQueue.push(message);
      if (SeverityUtil.value(this.flushSeverity) < SeverityUtil.value(message.severity)) {
        InnerLog.d('entered flush queue');
        
        if (this.flushQueue.length > this.flushSize) {
          this.flushQueue.shift();
        }
      }
      else { // the info needs to be flushed and saved
        InnerLog.d('entered save');
        const flushQueue = [...this.flushQueue];
        this.flushQueue = [];
        await this.saveLogs(flushQueue);
        this.createTimer();
      }
    }
    else if (log.type == LogType.Exception) {
      this.flushQueue.push(log);
      const flushQueue = [...this.flushQueue];
      this.flushQueue = [];
      await this.saveLogs(flushQueue);
      this.createTimer();
    }
  }
  flush(): void {
    InnerLog.d('flushed logs');
    this.send();
  }

  private async send() {
    InnerLog.d('entered send')
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    if (!SessionManager.token) return;


    let sessionsData = await this.loadSessionData();
        
    const resp = await ConnectionClient.request('sessions/uploadSavedData', sessionsData, HttpMethod.POST);
    if (resp.ok) {
      const text = await resp.text()
      InnerLog.i('got ok of upload ' + text)

    }
    else {
      const text = await resp.text()
      InnerLog.e('got not ok of upload '+ text);
    }
  }

  private async loadSessionData() {
    let storageData = <StorageData[]> await storage.popAllArrayObj(SESSION_DATA)
    this.hasLog = false;
    let sessionsData : SessionData[] = [];
    let sessionData: SessionData | undefined = undefined;

    if (storageData.length === 0) return;
    for (let data of storageData) {
      switch (data.type) {
        case DataType.Token:
          if (sessionData) sessionsData.push(sessionData);
          sessionData = { token: data.data.token, logs: []};
          break;

        case DataType.Login:
          if (sessionData) sessionsData.push(sessionData);
          sessionData = { login: data.data, logs: []};
          break;

        case DataType.User:
          sessionData!.user = data.data;
          break;
        case LogType.Exception:
          const {name, reason, stack} = data.data;
          let exception = await (new Exception(name, reason, stack)).getObj();
          sessionData!.logs.push(exception);
          break;
        default: // it is a log
          if (!sessionData) InnerLog.e('session data is empty', storageData);
          sessionData!.logs.push(data.data);
          break;
      }
    }

    if (sessionData) sessionsData.push(sessionData);
    return sessionsData;
  }

  private async saveLogs(logs: BaseLog[]) {
    let storageData: StorageData[] = [];
    if (!this.hasLog) {
      this.hasLog = true;
      const {token, loginObj} = SessionManager;
      if (token) {
        storageData.push({
          type: DataType.Token,
          data: {token}
        });
      }
      else if (loginObj){
        storageData.push({
          type: DataType.Login,
          data: loginObj
        });
      }
    }

    logs.forEach(log => {
      storageData.push({
        type: log.type,
        data: log
      });
    });
    await storage.pushArrayObj(SESSION_DATA, storageData);
  }
  

  private createTimer() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.send();
      this.timer = undefined;
    }, this.maxTime * 1000);
  }
}