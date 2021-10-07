import InnerLog from "./inner-log";
import Log from "./log";
import connectionClient from "./networking/connection-client";
import sessionManager from "./networking/session-manager";

export default class Shipbook {
  static async start(appId: string, appKey: string, url?: string) {
    return await sessionManager.login(appId, appKey);
  }

  static enableInnerLog(enable: boolean) {
    InnerLog.enabled = enable;
  }

  static setConnectionUrl(url: string) {
    connectionClient.BASE_URL = url;
  }

  static registerUser(userId: string, userName?: string, fullName?: string, email?: string, phoneNumber?: string, additionalInfo?: object) {

  }

  static logout() {

  }

  static getLogger(tag: string) {
    return new Log(tag);
  }

  static flush() {

  }

  static screen(name: string) {

  }
}