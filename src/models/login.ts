// https://github.com/react-native-device-info/react-native-device-info#getuniqueid
import { v4 as uuidv4 } from 'uuid';
import { Platform, NativeModules } from 'react-native';
import platform from '../platform';
import User from "./user";
import storage from '../storage';

const UUID = 'uuid';

export default class Login {
  appId: string;
  appKey: string;
  bundleIdentifier: string = '';
  appName: string = '';
  udid: string = '';
  time: Date;
  deviceTime: Date; // the device time in the time of the login request
  os: string =  Platform.OS;
  platform: string = 'react-native'
  osVersion: string = String(Platform.Version);
  appVersion: string = '';
  appBuild: string = '';
  sdkVersion: string = '0.2.1';
  // sdkBuild: string = '';
  manufacturer: string = platform.manufacturer;
  deviceName: string = '';
  deviceModel: string = platform.model;
  language: string;
  isDebug?: boolean;
  user?: User;

  constructor(appId: string, appKey: string) {
    this.appId = appId;
    this.appKey = appKey;

    this.time = new Date();
    this.deviceTime = this.time;
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      this.language =
        settings?.AppleLocale ||
        (Array.isArray(settings?.AppleLanguages) && settings.AppleLanguages.length > 0
          ? settings.AppleLanguages[0]
          : 'en'); // default to English
    } else {  // Android
      this.language = NativeModules.I18nManager?.localeIdentifier || 'en'; // default to English
    }  
  }

  async getObj() {
    if (this.udid.length === 0) {
      const uuid = await storage.getItem(UUID);
      if (uuid) this.udid = uuid;
      else {
        this.udid = uuidv4();
        await storage.setItem(UUID, this.udid);
      }
    }
    return this;
  }
}