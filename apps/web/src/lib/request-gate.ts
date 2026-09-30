export interface RequestGate {
  begin(): number;
  invalidate(): void;
  isCurrent(request: number): boolean;
}

export function createRequestGate(): RequestGate {
  let version = 0;
  return {
    begin: () => ++version,
    invalidate: () => { version += 1; },
    isCurrent: (request) => request === version
  };
}
