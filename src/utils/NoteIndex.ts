class NoteIndex {
  private index: NoteWithReplies[];

  constructor(initialIndex: NoteWithReplies[]) {
    this.index = initialIndex;
  }
  
  getAllParentNotes(): NoteWithReplies[] {
    return this.index;
  }
  async getContent(fileName: string): Promise<string | undefined> {
    try {
      const noteData = await window.electron.ipcRenderer.invoke('get-content', fileName);
      return noteData;
    } catch (error) {
      console.error('Error fetching note content:', error);
      return undefined;
    }
  }

  async updateContent(fileName: string, newContent: string): Promise<string | null> {
    try {
      await window.electron.ipcRenderer.invoke('update-content', fileName, newContent);
      return fileName;
    } catch (error) {
      console.error('Failed to update note content:', error);
      return null;
    }
  }

  async deleteNote(fileName: string): Promise<void> {
    try {
      await window.electron.ipcRenderer.invoke('delete-note', fileName);
      this.index = this.index.filter(note => note.fileName !== fileName);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }

  async updateNoteMetadata(fileName: string, metadata: Partial<NoteMetadata>): Promise<string | null> {
    const note = this.index.find(note => note.fileName === fileName);
    if (note) {
      this.index = this.index.map(note => note.fileName === fileName ? { ...note, ...metadata } : note);
      await window.electron.ipcRenderer.invoke('update-note-metadata', fileName, metadata);
      return fileName;
    } else {
      console.error('Note not found:', fileName);
      return null;
    }
  }

}

export default NoteIndex;

