export interface BaseAppender {
  name: string;
  update(config?: ConfigResponse): void;
  push(log: object): void;
  flush(): void;
}