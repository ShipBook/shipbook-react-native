import { CONNECTED, eventEmitter } from "../event-emitter";
import eventManager from "../event-manager";
import exceptionManager from "../exception-manager";
import InnerLog from "../inner-log";
import logManager from "../log-manager";
import Login from "../models/login";
import User from "../models/user";
import storage from "../storage";
import connectionClient, { HttpMethod } from "./connection-client";
import ConnectionClient from "./connection-client";

const defaultConfig: ConfigResponse= {
  appenders: [
    {
      type: "ConsoleAppender",
      name: "console",
      config : { pattern: "$message" }
    },
    {
      type: "SBCloudAppender",
      name: "cloud",
      config: {
        maxTime: 5,
        flushSeverity: "Warning"
      }
    }
  ],
  loggers: [
    {
      name: "",
      severity: "Verbose",
      appenderRef: "console"
    },
    {
      name: "",
      severity: "Verbose",
      appenderRef : "cloud"
   }
  ]
}
class SessionManager {
  token?: string;
  loginObj?: Login;
  user?: User;

  appId?: string;
  appKey?: string;

  private isInLoginRequest = false;
  async login(appId: string, appKey: string) {
    let config = <ConfigResponse> await storage.getObj("config");
    if (!config) config = defaultConfig;

    this.readConfig(config);
    this.appId = appId;
    this.appKey = appKey;
    this.loginObj = new Login(appId, appKey);
    return this.innerLogin();
  }

  async innerLogin(): Promise<string | undefined> {
    if (this.isInLoginRequest || !this.loginObj) return;

    this.isInLoginRequest = true;
    this.token = undefined;
    try {
      const loginObj = await this.loginObj.getObj();
      const resp = await ConnectionClient.request('auth/loginSdk', loginObj, HttpMethod.POST);
      this.isInLoginRequest = false;
  
      if (resp.ok) {
        const json = await resp.json();
        InnerLog.i('Succeeded! : ' + JSON.stringify(json));
        this.token = json.token;
    
        // set config information
        this.readConfig(json.config);
        eventEmitter.emit(CONNECTED);
  
        storage.setObj('config', json.config);
  
        return json.sessionUrl;  
      }
      else {
        InnerLog.e('didn\'t succeed to log')
        const text = await resp.text();
        if (text) {
          InnerLog.e('the info that was received: ' + text)
        }
        return;
      }
  
    }
    catch (e) {
      InnerLog.e('there was an error with the request', e);
    }
  }

  private readConfig(config: ConfigResponse) {
    if (!config.exceptionReportDisabled) exceptionManager.start();
    if (!config.eventLoggingDisabled) eventManager.enableAppState();
    else eventManager.removeAppState();
    logManager.config(config);
  }

  logout() {
    this.token = undefined; 
    this.user = undefined;
    if (this.loginObj) this.loginObj = new Login(this.appId!, this.appKey!);
    this.innerLogin();
  }

  registerUser(userId: string, 
               userName?: string, 
               fullName?: string,
               email?: string,
               phoneNumber?: string,
               additionalInfo?: object) {
    this.user = {
      userId, userName, fullName, email, phoneNumber, additionalInfo
    };
  }

  async refreshToken() {
    const refresh = {
      token: this.token,
      appKey: this.loginObj!.appKey
    }
    this.token = undefined;
    const resp = await connectionClient.request("auth/refreshSdkToken", refresh, HttpMethod.POST);
    if (resp.ok) {
      let json = await resp.json();
      this.token = json.token
      return true;
    }
    else return false;
  }

  getUUID() {
    return this.loginObj?.udid;
  }
}

export default new SessionManager();