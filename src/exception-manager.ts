// import { ErrorUtils } from 'react-native';

import InnerLog from "./inner-log";
import logManager from "./log-manager";
import Exception from "./models/exception";

class ExceptionManager {
  start() {
    InnerLog.i('starting exception manager');
    this.createException();
  }
  private createException() {
    const defaultErrorHandler = ErrorUtils.getGlobalHandler()
    ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      InnerLog.i(`exception error isFatal("${isFatal}"") name(${error.name}) message("${error.message}"), \nstack - ${error.stack}`);
      let exception = new Exception(error.name, error.message, error.stack);
      logManager.push(exception);

      defaultErrorHandler(error, isFatal);
    });
  }
}

export default new ExceptionManager();