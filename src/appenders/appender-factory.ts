import { BaseAppender } from "./base-appender";
import ConsoleAppender from "./console-appender";
import SBCloudAppender from "./sbcloud-appender";

class AppenderFactory {
  create(type: string, name: string, config?: ConfigResponse) : BaseAppender {
    switch (type) {
      case 'ConsoleAppender': return new ConsoleAppender(name, config);
      case 'SBCloudAppender': return new SBCloudAppender(name, config);
      default: throw new Error('Didn\'t have this appender');
    }
  }
}

export default new AppenderFactory();