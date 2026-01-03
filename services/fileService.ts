import { FileNode } from "../types";

export const getDirectoryHandle = async (): Promise<FileSystemDirectoryHandle> => {
  return await (window as any).showDirectoryPicker();
};

export const readDirectory = async (dirHandle: FileSystemDirectoryHandle, path: string = ""): Promise<FileNode[]> => {
  const entries: FileNode[] = [];
  
  for await (const entry of dirHandle.values()) {
    entries.push({
      name: entry.name,
      kind: entry.kind,
      handle: entry,
      path: `${path}/${entry.name}`
    });
  }
  
  // Sort directories first, then files
  return entries.sort((a, b) => {
    if (a.kind === b.kind) return a.name.localeCompare(b.name);
    return a.kind === 'directory' ? -1 : 1;
  });
};

export const readFile = async (fileHandle: FileSystemFileHandle): Promise<string> => {
  const file = await fileHandle.getFile();
  return await file.text();
};

export const getFile = async (fileHandle: FileSystemFileHandle): Promise<File> => {
  return await fileHandle.getFile();
};

export const saveFile = async (fileHandle: FileSystemFileHandle, content: string): Promise<void> => {
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
};

export const createFile = async (
  dirHandle: FileSystemDirectoryHandle, 
  name: string, 
  content: string = ""
): Promise<void> => {
  const fileHandle = await dirHandle.getFileHandle(name, { create: true });
  await saveFile(fileHandle, content);
};

export const deleteEntry = async (
  dirHandle: FileSystemDirectoryHandle,
  name: string
): Promise<void> => {
  await dirHandle.removeEntry(name);
};