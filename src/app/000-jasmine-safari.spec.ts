const jasmineGlobal = (globalThis as any).jasmine;

if (typeof window !== 'undefined' && jasmineGlobal?.StackTrace) {
  const OriginalStackTrace = jasmineGlobal.StackTrace;

  jasmineGlobal.StackTrace = function SafariSafeStackTrace(error: Error) {
    const trace = new OriginalStackTrace(error);
    trace.frames ??= [];

    while (trace.frames.length < 4) {
      trace.frames.push({ file: '', line: 0 });
    }

    return trace;
  };
}
