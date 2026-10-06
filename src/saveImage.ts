// File System Access is available in some browsers but is not in lib.dom yet.
declare global {
  interface Window {
    showSaveFilePicker?: (options: {
      suggestedName: string;
      types: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<{
      createWritable: () => Promise<{
        write: (data: Blob) => Promise<void>;
        close: () => Promise<void>;
        abort: () => Promise<void>;
      }>;
    }>;
  }
}

export function imageFilename(filename: string): string {
  return `${filename.replace(/\.[^.]+$/, "") || "code"}.png`;
}

export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  // Allow the browser to start the download before releasing its URL.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
