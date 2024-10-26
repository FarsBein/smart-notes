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
ipcMain.on('save-note', async (event, noteContent: string, attachments: Attachment[], isReply: boolean, tags: string[]) => {
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
            highlight: null,
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

        mainWindow.webContents.send('new-note', fileName);
    } catch (error) {
        console.error('Failed to save note with embedding:', error);
        event.reply('save-note-result', { success: false, error: error.message });
    }
});

ipcMain.handle('save-reply', async (event, noteContent: string, attachments: Attachment[], parentFileName: string, tags: string[]) => {
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
            highlight: null,
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

        return fileName;
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

ipcMain.handle('delete-note', async (event, fileName: string) => {
    const metadata = indexFileHandler.getMetadata(fileName);
    const metadataOfReplies = metadata.replies.map(reply => indexFileHandler.getMetadata(reply));
    const metadataOfAllFiles = [metadata, ...metadataOfReplies];
    try {
        // TODO: optimize to update the index and embeddings files only once
        await Promise.all(metadataOfAllFiles.map(async (metadata) => {
            await indexFileHandler.deleteNote(metadata.fileName);
            await indexFileHandler.deleteFileFromTags(metadata.fileName, metadata.tags);
            await embeddingHandler.deleteEmbedding(metadata.fileName);
            await markdownFileHandler.deleteFile(metadata.fileName);
        }));
        return { success: true };
    } catch (error) {
        console.error('Failed to delete note:', error);
        return {
            success: false,
            error: error instanceof NotesError 
                ? { code: error.code, message: error.message }
                : { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' }
        };
    }
});

ipcMain.handle('delete-reply', async (event, fileName: string) => {
    try {
        await indexFileHandler.deleteReply(fileName);
        await embeddingHandler.deleteEmbedding(fileName);
        return { success: true };
    } catch (error) {
        console.error('Failed to delete note:', error);
        return {
            success: false,
            error: error instanceof NotesError 
                ? { code: error.code, message: error.message }
                : { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' }
        };
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
