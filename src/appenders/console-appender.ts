import BaseLog, { LogType } from "../models/base-log";
import Message from "../models/message";
import { Severity } from "../models/severity";
import { BaseAppender } from "./base-appender";

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
    console.log('entered push')
    if (log.type == LogType.Message) {
      const message = await (<Message>log).getObj();
      const text = `${message.file} ${message.line} ${message.message}`;
      switch(message.severity) {
        // case Severity.Error:
        //   console.error(text);
        //   break;
        // case Severity.Warning:
        //   console.warn(text);
        //   break;
        // case Severity.Info:
        //   console.info(text);
        //   break;
        // case Severity.Debug:
        //   console.debug(text);
        //   break;
        default: 
          console.log(`${message.severity} - ${text}`)
          
      }
    }
  }
  flush(): void {
  }
}