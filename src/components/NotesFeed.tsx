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
      setNotes((prevNotes) => [...prevNotes, newNote]);
    };

    window.electron.ipcRenderer.on('new-note', handleSaveResult);

    return () => {
      window.electron.ipcRenderer.removeListener('new-note', handleSaveResult);
    };
  }, []);
  

  return (
    // TODO: append the notes in order of creation so you don't have to reverse
    <div className="notes-feed">
      {notes.slice().reverse().map((note, index) => (
        <div key={index} className="note-card">
          <h3>{note.fileName}</h3>
          <p>Created: {new Date(note.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(note.updatedAt).toLocaleString()}</p>
          <ReactMarkdown>{note.content}</ReactMarkdown>
          <div className="attachments">
            {note.attachments.map((attachment, i) => {
              if (attachment.endsWith('.png') || attachment.endsWith('.jpg') || attachment.endsWith('.jpeg')) {
                return <img key={i} src={attachment} alt="Attachment" />;
              } else {
                return <blockquote key={i}>{attachment}</blockquote>;
              }
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotesFeed;
