import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Note {
  fileName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  attachments: string[];
}

const NotesFeed: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const handleNotesData = (notesData: Note[]) => {
      setNotes(notesData);
    };

    window.electron.ipcRenderer.send('get-notes');
    window.electron.ipcRenderer.on('notes-data', handleNotesData);

    return () => {
        window.electron.ipcRenderer.removeListener('notes-data', handleNotesData);
    };
  }, []);

  return (
    <div className="notes-feed">
      {notes.map((note, index) => (
        <div key={index} className="note-card">
          <h3>{note.fileName}</h3>
          <p>Created: {new Date(note.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(note.updatedAt).toLocaleString()}</p>
          <ReactMarkdown>{note.content}</ReactMarkdown>
          <div className="attachments">
            {note.attachments.map((attachment, i) => {
              if (attachment.endsWith('.png') || attachment.endsWith('.jpg') || attachment.endsWith('.jpeg')) {
                return <img key={i} src={`file://${attachment}`} alt="Attachment" />;
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
