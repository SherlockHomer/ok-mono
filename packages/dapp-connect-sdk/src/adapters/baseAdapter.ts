// basic adapter class for request, on, removeListener and RPC error handling
import EventEmitter from "eventemitter3";
import { Logger, LogLevel, logger } from "../utils/logger";

abstract class BaseAdapter extends EventEmitter {
  protected logger: ReturnType<typeof logger.createScopedLogger>;

  constructor() {
    super();
    // Initialize scoped logger
    this.logger = this.initializeLogger();

    this.logger.debug('Adapter initialized');
  }

  // create proxy
  public static createProxy() {
    throw new Error('createProxy method not implemented');
  }

  public abstract request(args: {
    method: string;
    params: any[];
  }): Promise<any>;

  // protected

  public emit<T extends string | symbol>(event: T, ...args: any[]): boolean {
    this.logger.debug('Emitting event', event, args);
    return super.emit(event, ...args);
  }

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
