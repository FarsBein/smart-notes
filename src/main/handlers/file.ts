import { ipcMain, app } from 'electron';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import MetadataIndex from '../utils/metaDataIndex';
import { mainWindow } from '../main';
import { generateEmbedding } from '../utils/embeddings';
import MarkdownFileHandler from '../utils/markdownFileHandler';

const notesPath = path.join(app.getPath('documents'), 'MyNotes');
const attachmentsDir = path.join(notesPath, 'attachments');

const indexPath = path.join(notesPath, 'metadata_index.json');
const embeddingsPath = path.join(notesPath, 'embeddings.json');
const metadataIndex = new MetadataIndex(indexPath, embeddingsPath, notesPath);
const markdownHandler = new MarkdownFileHandler(notesPath);

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
        markdownHandler.writeFile(fileName, fullNoteContent);

        const embedding = await generateEmbedding(noteContent);

        metadataIndex.addNote(metadata, embedding);

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
        markdownHandler.writeFile(fileName, fullNoteContent);

        const embedding = await generateEmbedding(noteContent);
        metadataIndex.addReply(metadata, embedding);

        // update the parent file with the new reply
        const parentMetadata = metadataIndex.getMetadata(parentFileName);
        if (parentMetadata) {
            markdownHandler.updateReplies(parentFileName, [...parentMetadata.replies, fileName]);
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
    const metadata = metadataIndex.getMetadata(fileName);
    if (!metadata) {
        console.error('Note not found:', fileName);
        return null;
    }
    const content = metadataIndex.getContent(fileName);
    return { metadata, content };
});

ipcMain.handle('get-parent-notes-file-names', async (event) => {
    return metadataIndex.getParentNotesFileNames();
});

ipcMain.handle('delete-note', async (event, fileName: string) => {
    metadataIndex.deleteNote(fileName);
});

ipcMain.handle('delete-reply', async (event, fileName: string) => {
    metadataIndex.deleteReply(fileName);
});

ipcMain.handle('semantic-search', async (event, searchQuery: string) => {
    try {
        const queryEmbedding = await generateEmbedding(searchQuery);
        const similarNotes = metadataIndex.searchSimilarNotes(queryEmbedding);
        return similarNotes;
    } catch (err) {
        console.error('Failed to semantic search:', err);
        return null;
    }
});

ipcMain.handle('update-note', async (event, fileName: string, newContent: string, newTags: string[]) => {
    // update the metadata
    metadataIndex.updateTags(fileName, newTags);

    // update the note content and tags in the markdown file
    markdownHandler.updateContent(fileName, newContent);
    markdownHandler.updateTags(fileName, newTags);
});

ipcMain.handle('get-indexed-tags', async (event) => {
    return metadataIndex.getIndexedTags();
});

ipcMain.handle('get-filenames-that-contains-tags', async (event, tags: string[]) => {
    return metadataIndex.getFilenamesThatContainsTags(tags);
});

