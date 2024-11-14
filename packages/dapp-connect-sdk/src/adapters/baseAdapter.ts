// basic adapter class for request, on, removeListener and RPC error handling
import { type OKXUniversalProvider } from "@okxconnect/universal-provider";
import { Logger, LogLevel, logger } from "../utils/logger";

abstract class BaseAdapter {
  protected okxUniversalProvider: any;
  protected logger: ReturnType<typeof logger.createScopedLogger>;

  constructor(okxUniversalProvider: OKXUniversalProvider) {
    // Initialize scoped logger
    this.logger = this.initializeLogger();

    // setup OKXUniversalProvider
    this.okxUniversalProvider = okxUniversalProvider;
    this.logger.debug("Adapter initialized");
  }

  public abstract request(args: {
    method: string;
    params: any[];
  }): Promise<any>;

  public abstract on(event: string, callback: (...args: any[]) => void): void;

  public abstract removeListener(
    event: string,
    callback: (...args: any[]) => void
  ): void;

  // protected

  protected getLogger() {
    return this.logger;
  }

  // private methods

  private initializeLogger(): ReturnType<typeof logger.createScopedLogger> {
    const logger = Logger.getInstance();
    Logger.setLevel(LogLevel.DEBUG); // TODO: For development only
    return logger.createScopedLogger(this.constructor.name);
  }
}

export default BaseAdapter;
