import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const NotesFeed: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]); 
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchType, setSearchType] = useState<'semantic' | 'basic'>('semantic'); 

  useEffect(() => {
    const handleNotesData = (notesData: Note[]) => {
      console.log('get-notes notesData:', notesData);
      setNotes(notesData);
      setFilteredNotes(notesData); // Initialize filtered notes
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
      setFilteredNotes((prevNotes) => [newNote, ...prevNotes]);
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
        setFilteredNotes((prevNotes) => prevNotes.filter(note => note.fileName !== result.fileName));
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
        setFilteredNotes((prevNotes) => prevNotes.map(note => note.fileName === result.fileName ? { ...note, content: editContent, updatedAt: result.updatedAt } : note));
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

  useEffect(() => {
    const handleSearchResults = (result: { success: boolean, notesData?: Note[], error?: string }) => {
      console.log('search-result:', result);
      if (result.success) {
        setFilteredNotes(result.notesData || []);
      } else {
        console.error('Error searching notes:', result.error);
      }
    };

    window.electron.ipcRenderer.on('search-result', handleSearchResults);

    return () => {
      window.electron.ipcRenderer.removeListener('search-result', handleSearchResults);
    };
  }, []);

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

  const handleSearch = () => {
    if (searchType === 'semantic') {
      window.electron.ipcRenderer.send('search-notes', searchQuery);
    } else {
      // Perform basic search locally
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = notes.filter(note =>
        note.content.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredNotes(filtered);
    }
  };

  const exitSearch = () => {
    setSearchQuery('');
    setFilteredNotes(notes); // Reset to original notes
  };

  return (
    <div className="notes-feed">
      <div className="search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>Search</button>
        <button onClick={exitSearch}>Exit Search</button>
        <select value={searchType} onChange={(e) => setSearchType(e.target.value as 'semantic' | 'basic')}>
          <option value="semantic">Semantic Search</option>
          <option value="basic">Basic Search</option>
        </select>
      </div>
      {filteredNotes.map((note, index) => (
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
          <div className="tags">
            {note.tags.map((tag: string, i: number) => <span key={i}>{tag}</span>)}
          </div>
          <div className="attachments">
            {note.attachments.map((attachment, i) => renderAttachment(attachment, i))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotesFeed;
