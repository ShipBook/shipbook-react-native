import AppenderFactory from './appenders/appender-factory';
import {BaseAppender} from './appenders/base-appender';
import { CONFIG_CHANGE, eventEmitter } from './event-emitter';
import InnerLog from './inner-log';
import BaseLog from './models/base-log';
import Message from './models/message';
import {Severity, SeverityUtil } from './models/severity';

interface Logger {
  key: string;
  severity: Severity;
  callStackSeverity: Severity;
  appender: BaseAppender;

}


class LogManager {
  private appenders = new Map<string, BaseAppender>() ;
  private loggers: Logger[]= [];

  clear() {
    this.appenders.forEach(appender => appender.destructor());
    InnerLog.d('called clear');
    this.appenders.clear();
    this.loggers = [];
  }

  add(appender: BaseAppender, name: string) {
    const origAppender = this.appenders.get(name);
    if (appender != origAppender) appender?.destructor();
    this.appenders.set(name, appender);
  }

  remove(appenderName: string) {
    const appender = this.appenders.get(appenderName);
    appender?.destructor();
    this.appenders.delete(appenderName);
  }

  push(log: BaseLog) {
    if (log.type == 'message') {
      const message = <Message>log;
      let appenderNames = new Set<string>();
      this.loggers.forEach(logger => {
        if (message.tag!.startsWith(logger.key) && SeverityUtil.value(message.severity) <= SeverityUtil.value(logger.severity)) {
          appenderNames.add(logger.appender.name);
        }
      });

      appenderNames.forEach(name => {
        this.appenders.get(name)?.push(log);
      });
    }
    else { // isn't a message and therefor there isn't any tags
      this.appenders.forEach(appender => {
        appender.push(log);
      });
    }
  }

  flush() {
    this.appenders.forEach(appender => appender.flush());
  }

  getSeverity(tag: string): Severity {
    let severity = Severity.Off;
    this.loggers.forEach(logger => {
      if (tag.startsWith(logger.key) && SeverityUtil.value(logger.severity) > SeverityUtil.value(severity)) severity = logger.severity;
    });
    return severity;
  }

  getCallStackSeverity(tag: string): Severity {
    let callStackSeverity = Severity.Off;
    this.loggers.forEach(logger => {
      if (tag.startsWith(logger.key) && SeverityUtil.value(logger.callStackSeverity) > SeverityUtil.value(callStackSeverity)) callStackSeverity = logger.callStackSeverity;
    });
    return callStackSeverity;
  }

  config(conf: ConfigResponse) {
    // appenders
    this.clear();
    conf.appenders.forEach(appender => {
      try {
        const base = AppenderFactory.create(appender.type, appender.name, appender.config)  
        this.appenders.set(appender.name, base);  
      }
      catch (e) {
        InnerLog.e('didn\'t succeed to create appender: wrong appender name: ' + appender.name)
      }
    });

    // loggers 
    this.loggers = [];
    conf.loggers.forEach(logger => {
      const appender = this.appenders.get(logger.appenderRef);
      if (appender) {
        const log : Logger = {
          key: logger.name ?? '',
          severity: <Severity>logger.severity,
          callStackSeverity: <Severity>logger.callStackSeverity ?? Severity.Off,
          appender: appender
        }
        this.loggers.push(log);
      }
    });

    eventEmitter.emit(CONFIG_CHANGE);
  }
}

export default new LogManager();