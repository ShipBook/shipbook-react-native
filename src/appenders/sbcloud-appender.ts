import { AppState, AppStateStatus, NativeEventSubscription } from "react-native";

import InnerLog from "../inner-log";
import BaseEvent from "../models/base-event";
import BaseLog, { LogType } from "../models/base-log";
import Exception from "../models/exception";
import Login from "../models/login";
import Message from "../models/message";
import { Severity, SeverityUtil } from "../models/severity";
import User from "../models/user";
import ConnectionClient, { HttpMethod } from "../networking/connection-client";
import SessionManager from "../networking/session-manager";
import { AutoQueue } from "../queue";
import storage from "../storage";
import { BaseAppender } from "./base-appender";
import { USER_CHANGE, eventEmitter } from "../event-emitter";

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
  private maxLogSize = 5000;

  private flushQueue: BaseLog[] = [];
  private timer?:  NodeJS.Timeout;
  private hasLog: boolean = false;
  private appStateSubscription?: NativeEventSubscription; 
  private eventListener = async (state: AppStateStatus) => {
    InnerLog.d('Got state change: ' + state);
    if (state == 'background') {
      InnerLog.d('entered background');
      await this.send();
    }
  };

  static started = false;
  private aQueue = new AutoQueue();

  constructor(name: string, config?: ConfigResponse) {
    this.name = name;
    this.update(config);
    this.appStateSubscription = AppState.addEventListener("change", this.eventListener);
    SBCloudAppender.started = true;

    InnerLog.i("SBCloud constructor2");

    this.changeUser = this.changeUser.bind(this);
    eventEmitter.addListener(USER_CHANGE, this.changeUser);
    
  }

  destructor(): void { 
    InnerLog.d('destructor called', this.appStateSubscription);
    if (this.appStateSubscription) this.appStateSubscription.remove();
    else AppState.removeEventListener('change', this.eventListener); //for old versions or expo
    this.appStateSubscription = undefined;
    eventEmitter.removeListener(USER_CHANGE, this.changeUser);
  }

  private  changeUser() {
    InnerLog.i('user changed');
    let user = SessionManager.user;
    if (user) {
      this.saveToStorage(user);
      this.createTimer();
    }
  }

  update(config?: any): void {
    this.maxTime = config.maxTime ?? this.maxTime; 
    this.flushSeverity = config.flushSeverity ? (<any>Severity)[config.flushSeverity] :  this.flushSeverity;
    this.flushSize = config.flushSize ?? this.flushSize;
  }
  
  async push(log: BaseLog): Promise<void> {
    if (log.type == LogType.Message) await this.pushMessage(<Message>log);
    else if (log.type == LogType.Exception) await this.pushException(<Exception>log);
    else await this.pushEvent(log);
  }

  private async pushMessage(log: Message) {
    const message = await log.getObj();
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
      await this.saveToStorage(flushQueue);
      this.createTimer();
    }

  }

  private async pushException(exception: Exception) {
    this.flushQueue.push(exception);
    const flushQueue = [...this.flushQueue];
    this.flushQueue = [];
    await this.saveToStorage(flushQueue);
  }

  private async pushEvent(event: BaseEvent) {
    this.flushQueue.push(event);
    if (this.flushQueue.length > this.flushSize) {
      this.flushQueue.shift();
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


    const sessionsData = await this.loadSessionData();
    InnerLog.i("the sessions data is:", sessionsData);
    if (sessionsData.length == 0) return;
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
    let storageData = <StorageData[]> await storage.popAllArrayObj(SESSION_DATA);
    this.hasLog = false;
    let sessionsData : SessionData[] = [];
    let sessionData: SessionData | undefined = undefined;

    if (storageData.length === 0) return [];
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
          InnerLog.i('the user data', sessionData?.user);
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

  private async saveToStorage(data: BaseLog[] | User) {
    let size = await storage.arraySize(SESSION_DATA);
    if (size > this.maxLogSize) await storage.popAllArrayObj(SESSION_DATA); // pop also deletes all

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
    
    if (Array.isArray(data)) {
      let logs = <BaseLog[]>data;
      logs.forEach(log => {
        storageData.push({
          type: log.type,
          data: log
        });
      });
    }
    else { // User 
      storageData.push({
        type: DataType.User,
        data
      });
    }
    
    const task = async ()=> await storage.pushArrayObj(SESSION_DATA, storageData);
    await this.aQueue.enqueue(task);
  }
  
  private createTimer() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.send();
      this.timer = undefined;
    }, this.maxTime * 1000);
  }
}