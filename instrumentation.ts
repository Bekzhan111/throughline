export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensurePdfRuntime } = await import("./lib/pdf-runtime");
    ensurePdfRuntime();
  }
}
