export const getLinkAndSelectionFromWebpage = async () => {
    const url = await window.electron.ipcRenderer.invoke('get-page-info-from-webpage');
    return url;
}

