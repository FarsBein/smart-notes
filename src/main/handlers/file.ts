import { ipcMain, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { mainWindow } from '../main';
import { NotesError } from '../utils/errors';
import IndexFileHandler from '../services/indexFileHandler';
import EmbeddingFileHandler from '../services/embeddingFileHandler';
import MarkdownFileHandler from '../services/markdownFileHandler';

const notesPath = path.join(app.getPath('documents'), 'MyNotes');
const attachmentsDir = path.join(notesPath, 'attachments');

const indexPath = path.join(notesPath, 'metadata_index.json');
const embeddingsPath = path.join(notesPath, 'embeddings.json');

const indexFileHandler = new IndexFileHandler(indexPath);
const markdownFileHandler = new MarkdownFileHandler(notesPath);
const embeddingHandler = new EmbeddingFileHandler(embeddingsPath);

const timestampFileName = (currentDate: Date): string => {
    const year = String(currentDate.getFullYear()).slice(-2);
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const milliseconds = String(currentDate.getMilliseconds()).padStart(3, '0');
    const fileName = `${year}${month}${day}-${hours}${minutes}${seconds}.md`;
    return fileName;
}

// Save note to file
ipcMain.on('save-note', async (event, noteContent: string, attachments: Attachment[], isReply: boolean, tags: string[], selectedHighlight: string) => {
    try {
        const currentDate = new Date();
        const createdAt = currentDate.toISOString();
        const fileName = timestampFileName(currentDate);
        const filePath = path.join(notesPath, fileName);

        // Ensure directories exist
        await fs.mkdir(notesPath, { recursive: true });
        await fs.mkdir(attachmentsDir, { recursive: true });

        // Process attachments
        const processedAttachments = await Promise.all(attachments.map(async (attachment: Attachment) => {
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
                    await fs.mkdir(attachmentsDir, { recursive: true });
                    await fs.writeFile(path.join(attachmentsDir, imgFileName), Buffer.from(imgContentBase64Data, 'base64'));
                    const markdownImgPath = normalizedImgPath.split(path.sep).join('/'); // Ensure the path uses forward slashes for Markdown compatibility
                    return JSON.stringify(markdownImgPath);
                default:
                    return '';
            }
        })).then(results => results.filter(Boolean)); // Removes empty strings

        const metadata: NoteMetadata = {
            fileName,
            title: '',
            createdAt,
            updatedAt: createdAt,
            highlight: selectedHighlight,
            highlightColor: null,
            tags: tags,
            attachments: processedAttachments,
            replies: [],
            parentFileName: '',
            isReply: isReply,
            isAI: false,
            filePath
        };

        const frontmatter = `---\n` +
            `title: '${metadata.title}'\n` +
            `createdAt: '${metadata.createdAt}'\n` +
            `updatedAt: '${metadata.updatedAt}'\n` +
            `highlight: ${metadata.highlight}\n` +
            `highlightColor: ${metadata.highlightColor}\n` +
            `tags: ${JSON.stringify(metadata.tags)}\n` +
            `attachments: [${metadata.attachments.join(', ')}]\n` +
            `parentFileName: '${metadata.parentFileName}'\n` +
            `replies: [${metadata.replies.join(', ')}]\n` +
            `isReply: ${metadata.isReply}\n` +
            `isAI: ${metadata.isAI}\n` +
            `---\n`;

        const fullNoteContent = frontmatter + noteContent;
        await markdownFileHandler.writeFile(fileName, fullNoteContent);

        await embeddingHandler.addEmbedding(fileName, noteContent);
        await indexFileHandler.addNote(fileName, metadata);

        event.reply('save-note-result', { success: true, filePath });

        mainWindow.webContents.send('new-note', { fileName, content: noteContent, metadata });
    } catch (error) {
        console.error('Failed to save note with embedding:', error);
        event.reply('save-note-result', { success: false, error: error.message });
    }
});

ipcMain.handle('update-main-window-with-new-notes', (event, newNotes: {fileName: string, content: string, metadata?: NoteMetadata}[]) => {
    // TODO Create a better flow that doesn't have the popup window metadata out of sync with the index which currently happens because replies are updating parent note
    // This is just a patch for now we getting the metadata from the index for the new notes
    const newNotesWithMetadata = newNotes.map(note => ({...note, metadata: indexFileHandler.getMetadata(note.fileName)}));
    mainWindow.webContents.send('new-notes-sent', newNotesWithMetadata);
});

ipcMain.handle('save-note', async (event, noteContent: string, attachments: Attachment[], isReply: boolean, tags: string[], selectedHighlight: string) => {
    try {
        const currentDate = new Date();
        const createdAt = currentDate.toISOString();
        const fileName = timestampFileName(currentDate);
        const filePath = path.join(notesPath, fileName);

        // Ensure directories exist
        await fs.mkdir(notesPath, { recursive: true });
        await fs.mkdir(attachmentsDir, { recursive: true });

        // Process attachments
        const processedAttachments = await Promise.all(attachments.map(async (attachment: Attachment) => {
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
                    await fs.mkdir(attachmentsDir, { recursive: true });
                    await fs.writeFile(path.join(attachmentsDir, imgFileName), Buffer.from(imgContentBase64Data, 'base64'));
                    const markdownImgPath = normalizedImgPath.split(path.sep).join('/'); // Ensure the path uses forward slashes for Markdown compatibility
                    return JSON.stringify(markdownImgPath);
                default:
                    return '';
            }
        })).then(results => results.filter(Boolean)); // Removes empty strings

        const metadata: NoteMetadata = {
            fileName,
            title: '',
            createdAt,
            updatedAt: createdAt,
            highlight: selectedHighlight,
            highlightColor: null,
            tags: tags,
            attachments: processedAttachments,
            replies: [],
            parentFileName: '',
            isReply: isReply,
            isAI: false,
            filePath
        };

        const frontmatter = `---\n` +
            `title: '${metadata.title}'\n` +
            `createdAt: '${metadata.createdAt}'\n` +
            `updatedAt: '${metadata.updatedAt}'\n` +
            `highlight: ${metadata.highlight}\n` +
            `highlightColor: ${metadata.highlightColor}\n` +
            `tags: ${JSON.stringify(metadata.tags)}\n` +
            `attachments: [${metadata.attachments.join(', ')}]\n` +
            `parentFileName: '${metadata.parentFileName}'\n` +
            `replies: [${metadata.replies.join(', ')}]\n` +
            `isReply: ${metadata.isReply}\n` +
            `isAI: ${metadata.isAI}\n` +
            `---\n`;

        const fullNoteContent = frontmatter + noteContent;
        await markdownFileHandler.writeFile(fileName, fullNoteContent);

        await embeddingHandler.addEmbedding(fileName, noteContent);
        await indexFileHandler.addNote(fileName, metadata);

        return { fileName, metadata, content: noteContent };
    } catch (error) {
        console.error('Failed to save note with embedding:', error);
        throw error;
    }
});

ipcMain.handle('save-reply', async (event, noteContent: string, attachments: Attachment[], parentFileName: string, tags: string[], selectedHighlight: string) => {
    try {
        const currentDate = new Date();
        const createdAt = currentDate.toISOString();
        const fileName = timestampFileName(currentDate);
        const filePath = path.join(notesPath, fileName);

        // Ensure directories exist
        await fs.mkdir(notesPath, { recursive: true });
        await fs.mkdir(attachmentsDir, { recursive: true });

        // Process attachments
        const processedAttachments = await Promise.all(attachments.map(async (attachment: Attachment) => {
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
                    await fs.mkdir(attachmentsDir, { recursive: true });
                    await fs.writeFile(path.join(attachmentsDir, imgFileName), Buffer.from(imgContentBase64Data, 'base64'));
                    const markdownImgPath = normalizedImgPath.split(path.sep).join('/'); // Ensure the path uses forward slashes for Markdown compatibility
                    return JSON.stringify(markdownImgPath);
                default:
                    return '';
            }
        })).then(results => results.filter(Boolean)); // Removes empty strings

        const metadata: NoteMetadata = {
            fileName,
            title: '',
            createdAt,
            updatedAt: createdAt,
            highlight: selectedHighlight,
            highlightColor: null,
            tags: tags,
            attachments: processedAttachments,
            replies: [],
            parentFileName: parentFileName,
            isReply: true,
            isAI: false,
            filePath
        };

        const frontmatter = `---\n` +
            `title: '${metadata.title}'\n` +
            `createdAt: '${metadata.createdAt}'\n` +
            `updatedAt: '${metadata.updatedAt}'\n` +
            `highlight: ${metadata.highlight}\n` +
            `highlightColor: ${metadata.highlightColor}\n` +
            `tags: ${JSON.stringify(metadata.tags)}\n` +
            `attachments: [${metadata.attachments.join(', ')}]\n` +
            `parentFileName: '${metadata.parentFileName}'\n` +
            `replies: [${metadata.replies.join(', ')}]\n` +
            `isReply: ${metadata.isReply}\n` +
            `isAI: ${metadata.isAI}\n` +
            `---\n`;

        // write the reply to the file
        const fullNoteContent = frontmatter + noteContent;
        await markdownFileHandler.writeFile(fileName, fullNoteContent);

        await embeddingHandler.addEmbedding(fileName, noteContent);
        await indexFileHandler.addReply(fileName, metadata);

        // update the parent file with the new reply
        const parentMetadata = indexFileHandler.getMetadata(parentFileName);
        if (parentMetadata) {
            await markdownFileHandler.updateReplies(parentFileName, [...parentMetadata.replies, fileName]);
        } else {
            console.error('Parent note not found:', parentFileName);
        }

        return { fileName, metadata, content: noteContent };
    } catch (error) {
        console.error('Failed to save reply with embedding:', error);
        return null;
    }
});

ipcMain.handle('get-all-info', async (event, fileName: string) => {
    try {
        const metadata = await indexFileHandler.getMetadata(fileName);
        const content = await markdownFileHandler.getContent(fileName);
        return { metadata, content };
    } catch (error) {
        console.error('Failed to get note info:', error);
        return {
            error: error instanceof NotesError 
                ? { code: error.code, message: error.message }
                : { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' }
        };
    }
});

ipcMain.handle('get-parent-notes-file-names', async (event) => {
    return indexFileHandler.getParentNotesFileNames();
});

ipcMain.handle('delete-note', async (event, fileName: string): Promise<void> => {
    const metadata = indexFileHandler.getMetadata(fileName);
    const metadataOfReplies = metadata.replies.map(reply => indexFileHandler.getMetadata(reply));
    const metadataOfAllFiles = [metadata, ...metadataOfReplies];
    try {
        await Promise.all(metadataOfAllFiles.map(async (metadata) => {
            await indexFileHandler.deleteNoteOrReply(metadata.fileName, false);
            await indexFileHandler.deleteFileFromTags(metadata.fileName, metadata.tags, false);
            await embeddingHandler.deleteEmbedding(metadata.fileName, false);
            await markdownFileHandler.deleteFile(metadata.fileName);
        }));
        
        await Promise.all([
            indexFileHandler.saveIndex(),
            embeddingHandler.saveEmbeddings()
        ]);
    } catch (error) {
        console.error('Failed to delete note:', error);
        throw error instanceof NotesError 
                ? error
                : new NotesError('UNKNOWN_ERROR', 'An unexpected error occurred');
    }
});

ipcMain.handle('delete-reply', async (event, fileName: string): Promise<void> => {
    try {
        await indexFileHandler.deleteReply(fileName);
        await embeddingHandler.deleteEmbedding(fileName);
        await markdownFileHandler.deleteFile(fileName);
    } catch (error) {
        console.error('Failed to delete reply:', error);
        throw error instanceof NotesError 
                ? error
                : new NotesError('UNKNOWN_ERROR', 'An unexpected error occurred');
    }
});

ipcMain.handle('semantic-search', async (event, searchQuery: string) => {
    try {
        const similarFiles = await embeddingHandler.searchSimilar(searchQuery);
        const similarParentFiles = indexFileHandler.getParentFileNames(similarFiles);
        return similarParentFiles;
    } catch (err) {
        console.error('Failed to semantic search:', err);
        return null;
    }
});

ipcMain.handle('update-note', async (event, fileName: string, newContent: string, newTags: string[]) => {
    // TODO: optimize updating tags or content only if they have changed
    await indexFileHandler.updateTags(fileName, newTags);
    await markdownFileHandler.updateContent(fileName, newContent);
    await markdownFileHandler.updateTags(fileName, newTags);
});

ipcMain.handle('get-indexed-tags', async (event) => {
    return indexFileHandler.getIndexedTags();
});

ipcMain.handle('get-filenames-that-contains-tags', async (event, tags: string[]) => {
    return indexFileHandler.getFilenamesThatContainsTags(tags);
});

ipcMain.handle('get-all-notes-content', async (event): Promise<Record<string, string>> => {
    try {
        const allFileNames = indexFileHandler.getAllFileNames();
        const allNotesContent: Record<string, string> = {};
        for (const fileName of allFileNames) {
            allNotesContent[fileName] = await markdownFileHandler.getContent(fileName);
        }
        return allNotesContent;
    } catch (error) {
        console.error('Failed to get all notes content:', error);
        throw error instanceof NotesError 
            ? error
            : new NotesError('UNKNOWN_ERROR', 'An unexpected error occurred');
    }
});

ipcMain.handle('get-all-notes-metadata', async (event): Promise<Record<string, NoteMetadata>> => {
    return indexFileHandler.getAllNotesMetadata();
});

ipcMain.handle('update-highlight', async (event, fileName: string, selectedHighlight: string) => {
    await indexFileHandler.updateHighlight(fileName, selectedHighlight);
    await markdownFileHandler.updateHighlight(fileName, selectedHighlight);
});

