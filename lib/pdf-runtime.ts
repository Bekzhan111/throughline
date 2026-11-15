const join = function join(this: Iterable<unknown>, separator = ",") {
  return Array.from(this).join(separator);
};

function ensureJoin(proto: object | null) {
  if (!proto || typeof (proto as { join?: unknown }).join === "function") return;
  Object.defineProperty(proto, "join", { value: join, writable: true, configurable: true });
}

export function ensurePdfRuntime() {
  const scope = globalThis as unknown as { Iterator?: { prototype: object } };
  if (typeof scope.Iterator !== "function") {
    scope.Iterator = class Iterator {} as unknown as { prototype: object };
  }
  ensureJoin(scope.Iterator.prototype);
  const samples = [
    [][Symbol.iterator](),
    new Map()[Symbol.iterator](),
    new Set()[Symbol.iterator](),
    (function* sample() {})(),
  ];
  for (const sample of samples) ensureJoin(Object.getPrototypeOf(sample));
}
