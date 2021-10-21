import BaseLog from "../models/base-log";

export interface BaseAppender {
  name: string;
  update(config?: ConfigResponse): void;
  push(log: BaseLog): void;
  flush(): void;
  destructor(): void;
}