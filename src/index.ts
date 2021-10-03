import sessionManager from "./networking/session-manager";

export default class Shipbook {
  static async start(appId: string, appKey: string, url?: string) {
    return await sessionManager.login(appId, appKey);
  }

  static enableInnerLog(enable: boolean) {

  }

  static setConnectionUrl(url: string) {

  }

  static registerUser(userId: string, userName?: string, fullName?: string, email?: string, phoneNumber?: string, additionalInfo?: object) {

  }

  static logout() {

  }

  static getLogger() {

  }

  static flush() {

  }

  static screen(name: string) {

  }
}