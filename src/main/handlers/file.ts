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
ipcMain.on('save-note', async (event, noteContent: string, attachments: Attachment[], isReply: boolean) => {
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
            tags: [],
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
            `tags: [${metadata.tags.join(', ')}]\n` +
            `attachments: [${metadata.attachments.join(', ')}]\n` +
            `parentFileName: ${metadata.parentFileName}\n` +
            `replies: [${metadata.replies.join(', ')}]\n` +
            `isReply: ${metadata.isReply}\n` +
            `isAI: ${metadata.isAI}\n` +
            `---\n`;

        const fullNoteContent = frontmatter + noteContent;
        fs.writeFileSync(metadata.filePath, fullNoteContent);

        const embedding = await generateEmbedding(noteContent);

        metadataIndex.addNote(metadata, embedding);

        event.reply('save-note-result', { success: true, filePath });

        mainWindow.webContents.send('new-note', fileName);
    } catch (error) {
        console.error('Failed to save note with embedding:', error);
        event.reply('save-note-result', { success: false, error: error.message });
    }
});

ipcMain.handle('save-reply', async (event, noteContent: string, attachments: Attachment[], parentFileName: string) => {
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
            tags: [],
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
            `tags: [${metadata.tags.join(', ')}]\n` +
            `attachments: [${metadata.attachments.join(', ')}]\n` +
            `parentFileName: ${metadata.parentFileName}\n` +
            `replies: [${metadata.replies.join(', ')}]\n` +
            `isReply: ${metadata.isReply}\n` +
            `isAI: ${metadata.isAI}\n` +
            `---\n`;

        const fullNoteContent = frontmatter + noteContent;
        fs.writeFileSync(metadata.filePath, fullNoteContent);

        const embedding = await generateEmbedding(noteContent);
        metadataIndex.addReply(metadata, embedding);

        // update the parent file with the new reply
        const parentMetadata = metadataIndex.getMetadata(parentFileName);
        if (parentMetadata) {
            parentMetadata.replies.push(fileName);
            metadataIndex.updateMetadata(parentFileName, parentMetadata);
            const parentFrontmatter = metadataIndex.toFrontmatterString(parentFileName);
            const parentContent = fs.readFileSync(parentMetadata.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim();
            const newParentContent = parentFrontmatter + parentContent;
            fs.writeFileSync(parentMetadata.filePath, newParentContent);
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

ipcMain.handle('update-reply-content', async (event, fileName: string, newContent: string) => {
    const result = metadataIndex.updateReplyContent(fileName, newContent);
    return result;
});

ipcMain.handle('update-note-content', async (event, fileName: string, newContent: string) => {
    const result = metadataIndex.updateNoteContent(fileName, newContent);
    return result;
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