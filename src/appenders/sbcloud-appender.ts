import BaseLog, { LogType } from "../models/base-log";
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
    console.log('push log');
    if (log.type == LogType.Message) {
      console.log('before await');
      const message = await (<Message>log).getObj();
      console.log('after await');
      this.flushQueue.push(log);
      if (SeverityUtil.value(this.flushSeverity) < SeverityUtil.value(message.severity)) {
        console.log('entered fludh queue');
        
        if (this.flushQueue.length > this.flushSize) {
          this.flushQueue.shift();
        }
      }
      else { // the info needs to be flushed and saved
        console.log('entered save');
        const flushQueue = this.flushQueue;
        this.flushQueue = [];
        await this.saveLogs(flushQueue);
        console.log('before timer');
        this.createTimer();
        console.log('after timer');
      }
    }
  }
  flush(): void {
    console.log('flushed logs');
    this.send();
  }

  private async send() {
    console.log('entered send')
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    console.log('after emptying timer ')
    if (!SessionManager.token) return;


    let sessionsData = await this.loadSessionData();
        
    const resp = await ConnectionClient.request('sessions/uploadSavedData', sessionsData, HttpMethod.POST);
    if (resp.ok) {
      console.log('got ok of upload ')
    }
    else {
      console.log('got not ok of upload '+ resp.statusText);
    }
  }

  private async loadSessionData() {
    let storageData = <StorageData[]> await storage.popAllArrayObj(SESSION_DATA)
    console.log(storageData);
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
        default: // it is a log
          sessionData!.logs.push(data.data);
          break;
      }
    }

    return sessionsData;
  }

  private async saveLogs(logs: BaseLog[]) {
    let storageData: StorageData[] = [];
    if (!this.hasLog) {
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
    console.log('logs', logs);
    console.log('storage data', storageData);
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