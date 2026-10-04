// Helper to handle the "Select API Key" flow for paid features (Veo, Pro Image)

export async function ensureApiKeySelected(): Promise<boolean> {
  // @ts-ignore - aistudio is injected
  if (window.aistudio && window.aistudio.hasSelectedApiKey && window.aistudio.openSelectKey) {
     // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
       // @ts-ignore
      await window.aistudio.openSelectKey();
      // Assume success after dialog interaction, as per guidelines
      return true;
    }
    return true;
  }
  // Fallback for environments without the wrapper (dev/test), assume env var is fine
  return true;
}