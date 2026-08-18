
interface FileData {
  preview: null;
  file?: {
    name?: string;
    size?: number;
    type?: string;
    preview?: string;
  };
  type?:string;
  size?: number;
  originalname?: string;
  filename?: string;
  destination?: string;
  mimetype?: string;
}

const getFileSize = (file: FileData): string => ((file?.file?.size || file?.size || 0) / 1024 / 1024).toFixed(2);
const getFileName = (file: FileData): string => {
  if(file instanceof File){
    return file.name;
  }
  if(file?.file instanceof File){
    return file.file.name;
  }
  if(file?.originalname){
    return file.originalname;
  }
  return "Unknown file";
};
const getFilePreview = (file: FileData,url?:string): string | null => {

 let  previewUrl:string | null = null;
  if (file instanceof File) {
    previewUrl = URL.createObjectURL(file);
  }
  if(file?.file instanceof File){
    previewUrl = URL.createObjectURL(file.file as any);
  }
  if (file?.originalname) {
    previewUrl = `${url}${file.filename}`;
  }
  return previewUrl;
};

const getFileType = (file: FileData): string => {
  return file?.file?.type || file?.type  || file?.mimetype || "";
};

const getFileIcon = (file: FileData): string => {
  const fileType = getFileType(file);

  if(fileType.startsWith("image")) return "image";
  if(fileType.startsWith("application/pdf")) return "pdf";
  if(fileType.startsWith("application/msword")) return "word";
  if(fileType.startsWith("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) return "word";
  if(fileType.startsWith("application/vnd.ms-excel")) return "excel";
  if(fileType.startsWith("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) return "excel";
  return "file";
};

export { getFilePreview, getFileSize, getFileName, getFileType, getFileIcon };
