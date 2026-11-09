/** Billing split: workspace preview never spends the owner's xAI key. */

export const DEV_STANDIN_FILE_ID = "file_devlocalstudio";

/** True only on a published app. Preview keeps generation on internal routes. */
export function liveXaiBillingEnabled(workspacePreview: boolean): boolean {
  return workspacePreview === false;
}

export function developmentRequestId(jobId: string): string {
  return `dev-${jobId.replace(/-/g, "")}`.slice(0, 40);
}

export function isDevelopmentRequestId(id: string | null | undefined): boolean {
  return typeof id === "string" && /^dev-[a-f0-9]{8,36}$/i.test(id);
}
