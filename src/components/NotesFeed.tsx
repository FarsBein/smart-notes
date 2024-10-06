import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const NotesFeed: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);

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
  

  const renderAttachment = (attachment: string, index: number) => {
    const parsedAttachment = JSON.parse(attachment);
    if (parsedAttachment.startsWith('C:\\') && (parsedAttachment.endsWith('.png') || parsedAttachment.endsWith('.jpg') || parsedAttachment.endsWith('.jpeg'))) {
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
          <ReactMarkdown>{note.content}</ReactMarkdown>
          <div className="attachments">
            {note.attachments.map((attachment, i) => renderAttachment(attachment, i))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotesFeed;
