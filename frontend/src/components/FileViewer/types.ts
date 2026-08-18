export interface FileViewerProps {
  open: boolean;
  onClose: () => void;
  file: File | string | null;
  fileName?: string;
}

export type SupportedFileType = 'pdf' | 'image' | 'text' | 'unknown';

export interface FileViewerRef {
  openFile: (file: File | string, fileName?: string) => void;
  close: () => void;
}
