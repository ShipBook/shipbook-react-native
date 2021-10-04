import { CONNECTED, eventEmitter } from "../event-emitter";
import logManager from "../log-manager";
import Login from "../models/login";
import User from "../models/user";
import connectionClient, { HttpMethod } from "./connection-client";
import ConnectionClient from "./connection-client";

class SessionManager {
  token?: string;
  private loginObj?: Login;
  private user?: User;
  private isInLoginRequest = false;
  async login(appId: string, appKey: string) {
    // TODD save config


    console.log('entered login wow');
    this.loginObj = new Login(appId, appKey);
    return this.innerLogin();

  }

  async innerLogin(): Promise<string | undefined> {
    if (this.isInLoginRequest || !this.loginObj) return;

    this.isInLoginRequest = true;
    this.token = undefined;
    const resp = await ConnectionClient.request('auth/loginSdk', this.loginObj, HttpMethod.POST);
    this.isInLoginRequest = false;

    if (resp.ok) {
      const json = await resp.json();
      console.log('Succeeded! : ' + JSON.stringify(json));
      this.token = json.token;
  
      // set config information
      logManager.config(json.config);
      eventEmitter.emit(CONNECTED);

      // saf
      return json.sessionUrl;  
    }
    else {
      console.log('didn\'t succeed to log')
      const text = await resp.text();
      if (text) {
        console.log('the info that was received: ' + text)
      }
      return;
    }
  }

  logout() {

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
}

export default new SessionManager();