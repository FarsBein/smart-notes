import { contextBridge, ipcRenderer } from 'electron';

const electronHandler = {
  ipcRenderer: {
    send(channel: string, ...args: any[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: string, func: (...args: any[]) => void) {
      const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => func(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once(channel: string, func: (...args: any[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    removeListener(channel: string, func: (...args: any[]) => void) {
      ipcRenderer.removeListener(channel, func);
    },
    invoke(channel: string, ...args: any[]): Promise<any> {
      return ipcRenderer.invoke(channel, ...args);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
