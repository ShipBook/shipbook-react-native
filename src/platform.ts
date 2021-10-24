
import { Platform as ReactPlatform, PlatformAndroidStatic, Dimensions } from 'react-native';
import innerLog from './inner-log';

class Platform {
  isPortrait() {
    const dim = Dimensions.get('screen');
    return dim.height >= dim.width;
  };
  get orientation(): string {
    return this.isPortrait() ? 'portrait' : 'landscape'
  }

  get os() {
    return ReactPlatform.OS;
  }

  get model() {
    if (ReactPlatform.OS == 'android') {
      const p: PlatformAndroidStatic = ReactPlatform;
      return p.constants.Model;
    }
    else return '';
  }
  get manufacturer() {
    innerLog.d(`the platform , ${JSON.stringify(ReactPlatform.constants)}`)
    if (ReactPlatform.OS == 'android') {
      const p: PlatformAndroidStatic = ReactPlatform;
      return p.constants.Manufacturer ?? 'google';
    }
    else return 'apple';
  }
}

export default new Platform();