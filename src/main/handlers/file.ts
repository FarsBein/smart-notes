import { ipcMain, app } from 'electron';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import MetadataIndex from '../utils/metaDataIndex';
import { mainWindow } from '../main';
import { generateEmbedding } from '../utils/embeddings';

const notesPath = path.join(app.getPath('documents'), 'MyNotes');
const attachmentsDir = path.join(notesPath, 'attachments');

const indexPath = path.join(notesPath, 'metadata_index.json');
const embeddingsPath = path.join(notesPath, 'embeddings.json');
const metadataIndex = new MetadataIndex(indexPath, embeddingsPath);

// Save note to file
ipcMain.on('save-note', async (event, noteContent: string, attachments: Attachment[], isReply: boolean) => {
    try {
        const currentDate = new Date();
        const year = String(currentDate.getFullYear()).slice(-2);
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');
        const milliseconds = String(currentDate.getMilliseconds()).padStart(3, '0');
        const fileName = `${year}${month}${day}-${hours}${minutes}${seconds}.md`;

        const filePath = path.join(notesPath, fileName);

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
                    const imgContentBase64Data = attachment.content.replace(/^data:image\/png;base64,/, "");
                    const imgFileName = `image-${crypto.randomBytes(4).toString('hex')}.png`;
                    const imgFilePath = path.join('attachments', imgFileName);
                    const normalizedImgPath = path.normalize(imgFilePath); // Normalize the path to remove any potential double slashes
                    fs.writeFileSync(path.join(attachmentsDir, imgFileName), Buffer.from(imgContentBase64Data, 'base64'));
                    const markdownImgPath = normalizedImgPath.split(path.sep).join('/'); // Ensure the path uses forward slashes for Markdown compatibility
                    return JSON.stringify(markdownImgPath);
                default:
                    return '';
            }
        }).filter(Boolean); // Removes empty strings


        // generate embedding
        const embedding = await generateEmbedding(noteContent);

        const metadata: NoteMetadata = {
            fileName,
            title: '',
            createdAt: currentDate.toISOString(),
            updatedAt: currentDate.toISOString(),
            highlight: null,
            highlightColor: null,
            tags: [],
            attachments: processedAttachments,
            replies: [],
            isReply: isReply,
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

                metadataIndex.addNote(metadata, embedding);

                event.reply('save-note-result', { success: true, filePath });

                // Trigger new-note event
                const newNote: Note = {
                    fileName,
                    content: noteContent,
                    createdAt: currentDate.toISOString(),
                    updatedAt: currentDate.toISOString(),
                    attachments: processedAttachments,
                    tags: [],
                    replies: [],
                    isReply: isReply
                };

                mainWindow.webContents.send('new-note', newNote);
            }
        });
    } catch (error) {
        console.error('Failed to save note with embedding:', error);
        event.reply('save-note-result', { success: false, error: error.message });
    }
});


// Get All notes (Nested replies)
ipcMain.on('get-notes', (event) => {
    const notes = metadataIndex.getParentNotesMetadata();
    const notesData: Note[] = notes.map(note => {
        const replies = note.replies.map(replyFileName => {
            const replyMetadata = metadataIndex.getNoteMetadata(replyFileName);
            return {
                fileName: replyMetadata.fileName,
                content: fs.readFileSync(replyMetadata.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim(),
                createdAt: replyMetadata.createdAt,
                updatedAt: replyMetadata.updatedAt,
                attachments: replyMetadata.attachments,
                tags: replyMetadata.tags,
                replies: [] as Note[],
                isReply: replyMetadata.isReply
            };
        });

        return {
            fileName: note.fileName,
            content: fs.readFileSync(note.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim(),
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            attachments: note.attachments,
            tags: note.tags,
            replies: replies,
            isReply: note.isReply
        }
    });

    console.log('notesData:', notesData);
    event.reply('notes-data', notesData);
});


// Delete note
ipcMain.on('delete-note', (event, fileName: string) => {
    try {
        metadataIndex.deleteNote(fileName);
        fs.unlinkSync(path.join(notesPath, fileName)); // Delete the file from the filesystem
        event.reply('delete-note-result', { success: true, fileName });
    } catch (error) {
        console.error('Failed to delete note:', error);
        event.reply('delete-note-result', { success: false, error: error.message });
    }
});

// Update note
ipcMain.on('update-note', async (event, fileName: string, newContent: string) => {
    try {
        const note = metadataIndex.getNoteMetadata(fileName);
        if (!note) throw new Error('Note not found');
        let fullNoteContent = fs.readFileSync(note.filePath, 'utf-8');
        const oldContent = fullNoteContent.replace(/^---[\s\S]*?---/, '').trim()
        
        // Update the note content
        const updatedAt = new Date().toISOString();
        fullNoteContent = fullNoteContent.replace(oldContent, newContent);
        fs.writeFileSync(note.filePath, fullNoteContent);

        // Update metadata
        metadataIndex.updateNoteMetadata(fileName, { updatedAt });

        event.reply('update-note-result', { success: true, fileName, updatedAt });
    } catch (error) {
        console.error('Failed to update note:', error);
        event.reply('update-note-result', { success: false, error: error.message });
    }
});


// Search notes
ipcMain.on('search-notes', async (event, searchQuery: string) => {
    try {
        const queryEmbedding = await generateEmbedding(searchQuery);
        const similarNotes = metadataIndex.searchSimilarNotes(queryEmbedding);
        const notesData: Note[] = similarNotes.map(note => {
            const replies = note.replies.map(replyFileName => {
                const replyMetadata = metadataIndex.getNoteMetadata(replyFileName);
                return {
                    fileName: replyMetadata.fileName,
                    content: fs.readFileSync(replyMetadata.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim(),
                    createdAt: replyMetadata.createdAt,
                    updatedAt: replyMetadata.updatedAt,
                    attachments: replyMetadata.attachments,
                    tags: replyMetadata.tags,
                    replies: [] as Note[],
                    isReply: replyMetadata.isReply
                };
            });
    
            return {
                fileName: note.fileName,
                content: fs.readFileSync(note.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim(),
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
                attachments: note.attachments,
                tags: note.tags,
                replies: replies,
                isReply: note.isReply
            }
        });
        event.reply('search-result', { success: true, notesData });
    } catch (err) {
        event.reply('search-result', { success: false, error: err.message });
    }
});

// not used for now ----------------------------------------------------------------
// Get single note
ipcMain.on('get-note', (event, fileName: string) => {
    const note = metadataIndex.getNoteMetadata(fileName);
    if (!note) {
        console.error('Note not found:', fileName);
        event.reply('note-data', null);
        return;
    }

    const replies = note.replies.map(reply => {
        const replyMetadata = metadataIndex.getNoteMetadata(reply);
        return {
            fileName: replyMetadata.fileName,
            content: fs.readFileSync(replyMetadata.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim(),
            createdAt: replyMetadata.createdAt,
            updatedAt: replyMetadata.updatedAt,
            attachments: replyMetadata.attachments,
            tags: replyMetadata.tags,
            replies: [] as Note[],
            isReply: replyMetadata.isReply
        };
    });

    const noteData: Note = {
        fileName: note.fileName,
        content: fs.readFileSync(note.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim(),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        attachments: note.attachments,
        tags: note.tags,
        replies: replies,
        isReply: note.isReply
    };

    console.log('single note:', noteData);
    event.reply('note-data', noteData);
});