import { BaseAppender } from "./base-appender";
import ConsoleAppender from "./console-appender";

class AppenderFactory {
  create(type: string, name: string, config?: ConfigResponse) : BaseAppender {
    switch (type) {
      case 'ConsoleAppender': return new ConsoleAppender(name, config);
      default: throw new Error('Didn\'t have this appender');
    }
  }
}

export default new AppenderFactory();