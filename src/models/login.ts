// https://github.com/react-native-device-info/react-native-device-info#getuniqueid

import User from "./user";


export default class Login {
  appId: string;
  appKey: string;
  bundleIdentifier: string = '';
  appName: string = '';
  udid: string = 'TEST UDID';
  time: Date;
  deviceTime: Date; // the device time in the time of the login request
  os: string = '';
  osVersion: string = '';
  appVersion: string = '';
  appBuild: string = '';
  sdkVersion: string = '';
  sdkBuild: string = '';
  manufacturer: string = '';
  deviceName: string = '';
  deviceModel: string = '';
  language: string = '';
  isDebug?: boolean;
  user?: User;

  constructor(appId: string, appKey: string) {
    this.appId = appId;
    this.appKey = appKey;

    this.time = new Date();
    this.deviceTime = this.time;
  }
}