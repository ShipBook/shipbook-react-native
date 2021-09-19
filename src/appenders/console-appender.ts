import Message from "../models/message";
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

  push(log: BaseLog): void {
    if (log.type == LogType.Message) console.log((<Message>log).message);
  }
  flush(): void {
  }
}