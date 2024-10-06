import { ipcMain, app } from 'electron';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import MetadataIndex from '../utils/MetaDataIndex';
import { mainWindow } from '../main';

const notesPath = path.join(app.getPath('documents'), 'MyNotes');
const indexPath = path.join(notesPath, 'metadata_index.json');
const metadataIndex = new MetadataIndex(indexPath);

// Save note to file
ipcMain.on('save-note', (event, noteContent: string, attachments: Attachment[]) => {
    const currentDate = new Date();
    const year = String(currentDate.getFullYear()).slice(-2);
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const milliseconds = String(currentDate.getMilliseconds()).padStart(3, '0');
    const fileName = `${year}${month}${day}-${hours}${minutes}${seconds}.md`;

    const notesPath = path.join(app.getPath('documents'), 'MyNotes');
    const filePath = path.join(notesPath, fileName);
    const attachmentsDir = path.join(notesPath, 'attachments');

    // Ensure directories exist
    fs.mkdirSync(notesPath, { recursive: true });
    fs.mkdirSync(attachmentsDir, { recursive: true });

    // Process attachments
    const processedAttachments = attachments.map((attachment: Attachment) => {
        switch (attachment.type) {
            case 'url':
                return JSON.stringify(attachment.content);
            case 'text':
                // TODO: find a better way to handle new line in quotes attachments 
                return JSON.stringify(attachment.content.replace(/\n/g, ''));
            case 'image':
                const imgFileName = `image-${crypto.randomBytes(4).toString('hex')}.png`;
                const imgFilePath = path.join(attachmentsDir, imgFileName);
                fs.writeFileSync(imgFilePath, Buffer.from(attachment.content, 'base64'));
                return JSON.stringify(`safe-file://attachments/${imgFileName}`);
            default:
                return '';
        }
    }).filter(Boolean); // filter(Boolean) for removing empty strings

    const metadata: NoteMetadata = {
        fileName,
        title: '',
        createdAt: currentDate.toISOString(),
        updatedAt: currentDate.toISOString(),
        highlight: null,
        highlightColor: null,
        tags: [],
        replies: [],
        attachments: processedAttachments,
        isReply: true,
        isAI: false,
        filePath
    };

    // Generate frontmatter string 
    const frontmatter = `---\n` +
        `title: '${metadata.title}'\n` +
        `createdAt: '${metadata.createdAt}'\n` +
        `updatedAt: '${metadata.updatedAt}'\n` +
        `highlight: ${metadata.highlight}\n` +
        `highlightColor: ${metadata.highlightColor}\n` +
        `tags: [${metadata.tags.join(', ')}]\n` +
        `replies: [${metadata.replies.join(', ')}]\n` +
        `attachments: [${metadata.attachments.join(', ')}]\n` +
        `isReply: ${metadata.isReply}\n` +
        `isAI: ${metadata.isAI}\n` +
        `---\n`;

    const fullNoteContent = frontmatter + noteContent;

    // Write the full note content to the file
    fs.writeFile(filePath, fullNoteContent, (err) => {
        if (err) {
            console.error('Failed to save note:', err);
            event.reply('save-note-result', { success: false, error: err.message });
        } else {
            console.log('Note saved successfully:', filePath);
            
            // Add metadata to the index after successful file write
            metadataIndex.addNote(metadata);
            
            event.reply('save-note-result', { success: true, filePath });
            
            // Trigger new-note event
            const newNote: Note = {
                fileName,
                content: noteContent,
                createdAt: currentDate.toISOString(),
                updatedAt: currentDate.toISOString(),
                attachments: processedAttachments
            };
            
            mainWindow.webContents.send('new-note', newNote);
        }
    });
});

// Get all notes
ipcMain.on('get-notes', (event) => {
    const notes = metadataIndex.getNotes();
    const notesData: Note[] = notes.map(note => ({
        fileName: note.fileName,
        content: fs.readFileSync(note.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim(),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        attachments: note.attachments
    }));

    console.log('notesData:', notesData);
    event.reply('notes-data', notesData);
});

// unused for now ----------------------------------------------------------------
// Get single note
ipcMain.on('get-note', (event, fileName: string) => {
    const note = metadataIndex.getNoteMetadata(fileName);
    if (!note) {
        console.error('Note not found:', fileName);
        event.reply('note-data', null);
        return;
    }

    const noteData: Note = {
        fileName: note.fileName,
        content: fs.readFileSync(note.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim(),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        attachments: note.attachments
    };

    console.log('single note:', noteData);
    event.reply('note-data', noteData);
});