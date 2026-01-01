import BaseLog, { LogType } from "../models/base-log";
import Message from "../models/message";
// import { Severity } from "../models/severity";
import { BaseAppender } from "./base-appender";
import { Severity } from "../models/severity";

export default class ConsoleAppender implements BaseAppender {
  name: string;
  pattern?: string;
  constructor(name: string, config?: ConfigResponse) {
    this.name = name;
    this.update(config);
  }

  update(config?: ConfigResponse): void {
    this.pattern = config?.pattern;
  }

  async push(log: BaseLog): Promise<void> {
    if (log.type == LogType.Message) {
      const message = await (<Message>log).getObj();
      const text = `${message.message}`;
      switch(message.severity) {
        case Severity.Error:
          console.error(text);
          break;
        case Severity.Warning:
          console.warn(text);
          break;
        case Severity.Info:
          console.info(text);
          break;
        case Severity.Debug:
          console.debug(text);
          break;
        case Severity.Verbose:
        default: // only Verbose 
          console.log(`${text}`)
      }
    }
  }
  flush(): void {
  }
  destructor(): void {
  }
}