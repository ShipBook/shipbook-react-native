import AppenderFactory from './appenders/appender-factory';
import {BaseAppender} from './appenders/base-appender';
import Message from './models/message';


interface Logger {
  key: string;
  severity: Severity;
  callStackSeverity: Severity;
  appender: BaseAppender;

}


class LogManager {
  appenders = new Map<string, BaseAppender>() ;
  loggers: Logger[]= [];

  clear() {
    this.appenders.clear();
    this.loggers = [];
  }

  add(appender: BaseAppender, name: string) {
    this.appenders.set(name, appender);
  }

  remove(appenderName: string) {
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
    this.appenders = new Map<string, BaseAppender>();
    conf.appenders.forEach(appender => {
      try {
        const base = AppenderFactory.create(appender.type, appender.name, appender.config)  
        this.appenders.set(appender.name, base);  
      }
      catch (e) {
        console.log('didn\'t succeed to create appender: wron appender name: ' + appender.name)
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
  }
}

export default new LogManager();