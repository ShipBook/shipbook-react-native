import InnerLog from "./inner-log";
import Log from "./log";
import logManager from "./log-manager";
import ScreenEvent from "./models/screen-event";
import connectionClient from "./networking/connection-client";
import sessionManager from "./networking/session-manager";

export default class Shipbook {
  static async start(appId: string, appKey: string, appInfo?: {
    appVersion?: string;
    appBuild?: string;
  }) {
    return await sessionManager.login(appId, appKey, appInfo);
  }

  static enableInnerLog(enable: boolean) {
    InnerLog.enabled = enable;
  }

  static setConnectionUrl(url: string) {
    connectionClient.BASE_URL = url;
  }

  static registerUser(userId: string, userName?: string, fullName?: string, email?: string, phoneNumber?: string, additionalInfo?: object) {
    sessionManager.registerUser(userId, userName, fullName, email, phoneNumber, additionalInfo);
  }

  static logout() {
    sessionManager.logout();
  }

  static getLogger(tag: string) {
    return new Log(tag);
  }

  static flush() {
    logManager.flush();
  }

  static screen(name: string) {
    const event = new ScreenEvent(name);
    logManager.push(event);
  }

  static getUUID() {
    return sessionManager.getUUID();
  }
}