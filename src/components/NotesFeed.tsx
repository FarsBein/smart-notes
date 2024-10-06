import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const NotesFeed: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  useEffect(() => {
    const handleNotesData = (notesData: Note[]) => {
      console.log('get-notes notesData:', notesData);
      setNotes(notesData);
    };

    window.electron.ipcRenderer.send('get-notes');
    window.electron.ipcRenderer.on('notes-data', handleNotesData);

    return () => {
      window.electron.ipcRenderer.removeListener('notes-data', handleNotesData);
    };
  }, []);

  useEffect(() => {
    const handleSaveResult = (newNote: Note) => {
      console.log('new-note:', newNote);
      setNotes((prevNotes) => [newNote, ...prevNotes]);
    };

    window.electron.ipcRenderer.on('new-note', handleSaveResult);

    return () => {
      window.electron.ipcRenderer.removeListener('new-note', handleSaveResult);
    };
  }, []);

  useEffect(() => {
    const handleDeleteResult = (result: { success: boolean, fileName?: string, error?: string }) => {
      if (result.success) {
        setNotes((prevNotes) => prevNotes.filter(note => note.fileName !== result.fileName));
      } else {
        console.error('Failed to delete note:', result.error);
      }
    };

    window.electron.ipcRenderer.on('delete-note-result', handleDeleteResult);

    return () => {
      window.electron.ipcRenderer.removeListener('delete-note-result', handleDeleteResult);
    };
  }, []);

  useEffect(() => {
    const handleUpdateResult = (result: { success: boolean, fileName?: string, updatedAt?: string, error?: string }) => {
      if (result.success) {
        setNotes((prevNotes) => prevNotes.map(note => note.fileName === result.fileName ? { ...note, content: editContent, updatedAt: result.updatedAt } : note));
        setEditingNote(null);
      } else {
        console.error('Failed to update note:', result.error);
      }
    };

    window.electron.ipcRenderer.on('update-note-result', handleUpdateResult);

    return () => {
      window.electron.ipcRenderer.removeListener('update-note-result', handleUpdateResult);
    };
  }, [editContent]);

  const deleteNote = (fileName: string) => {
    window.electron.ipcRenderer.send('delete-note', fileName);
  };

  const startEditing = (fileName: string, content: string) => {
    setEditingNote(fileName);
    setEditContent(content);
  };

  const saveEdit = (fileName: string) => {
    window.electron.ipcRenderer.send('update-note', fileName, editContent);
  };

  const renderAttachment = (attachment: string, index: number) => {
    const parsedAttachment = JSON.parse(attachment);
    if (parsedAttachment.startsWith('attachments/') && (parsedAttachment.endsWith('.png') || parsedAttachment.endsWith('.jpg') || parsedAttachment.endsWith('.jpeg'))) {
      return (
        <img 
          key={index} 
          src={`safe-file://${parsedAttachment}`} 
          alt="Attachment" 
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            console.error('Failed to load image:', parsedAttachment);
          }}
        />
      );
    } else {
      return <blockquote key={index}>{parsedAttachment}</blockquote>;
    }
  };

  return (
    <div className="notes-feed">
      {notes.map((note, index) => (
        <div key={index} className="note-card">
          <h3>{note.fileName}</h3>
          <p>Created: {new Date(note.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(note.updatedAt).toLocaleString()}</p>

          <div>
            <button onClick={() => deleteNote(note.fileName)}>Delete</button>
            {editingNote === note.fileName ? (
              <>
                <button onClick={() => saveEdit(note.fileName)}>Save</button>
                <button onClick={() => setEditingNote(null)}>Cancel</button>
              </>
            ) : (
              <button onClick={() => startEditing(note.fileName, note.content)}>Edit</button>
            )}
          </div>

          {editingNote === note.fileName ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={10}
              cols={50}
            />
          ) : (
            <ReactMarkdown>{note.content}</ReactMarkdown>
          )}

          <div className="attachments">
            {note.attachments.map((attachment, i) => renderAttachment(attachment, i))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotesFeed;
