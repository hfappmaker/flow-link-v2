import { AsyncLocalStorage } from "node:async_hooks";

const requestStorage = new AsyncLocalStorage<Request>();

export function withMcpRequestContext<T>(request: Request, callback: () => T) {
  return requestStorage.run(request, callback);
}

export function getMcpRequest() {
  return requestStorage.getStore() ?? null;
}
