import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { app } from 'electron';

// todo: move to a global interface file
interface Attachment {
    type: 'url' | 'image' | 'text' | 'none';
    content: string;
}

interface Note {
    fileName: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    attachments: string[];
}

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
    const attachmentsMetadata = attachments.map((attachment: Attachment) => {
        switch (attachment.type) {
            case 'url':
                return JSON.stringify(attachment.content);
            case 'text':
                return JSON.stringify(attachment.content.replace(/\n/g, ''));
            case 'image':
                const imgFileName = `image-${crypto.randomBytes(4).toString('hex')}.png`;
                const imgFilePath = path.join(attachmentsDir, imgFileName);
                fs.writeFileSync(imgFilePath, Buffer.from(attachment.content, 'base64'));
                // Use forward slashes and JSON.stringify to properly escape the path
                return JSON.stringify(path.join(notesPath, 'attachments', imgFileName).replace(/\\/g, '/'));
            default:
                return '';
        }
    }).filter(Boolean).join(',');

    let metadata = `---\n` +
        `createdAt: '${currentDate.toISOString()}'\n` +
        `updatedAt: '${currentDate.toISOString()}'\n` +
        `attachments: [${attachmentsMetadata}]\n` +
        `---\n`;

    const fullNoteContent = metadata + noteContent;

    // Write the full note content to the file
    fs.writeFile(filePath, fullNoteContent, (err) => {
        if (err) {
            console.error('Failed to save note:', err);
            event.reply('save-note-result', { success: false, error: err.message });
        } else {
            console.log('Note saved successfully:', filePath);
            event.reply('save-note-result', { success: true, filePath });
        }
    });
});

// Get notes
ipcMain.on('get-notes', (event) => {
    const notesPath = path.join(app.getPath('documents'), 'MyNotes');

    fs.readdir(notesPath, (err, files) => {
        if (err) {
            console.error('Error reading notes directory:', err);
            event.reply('notes-data', []);
            return;
        }

        const markdownFiles = files.filter(file => file.endsWith('.md'));

        const notesData: Note[] = markdownFiles.map((fileName) => {
            const filePath = path.join(notesPath, fileName);
            const content = fs.readFileSync(filePath, 'utf-8');

            // Parse the frontmatter
            const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
            const match = content.match(frontmatterRegex);
            const frontmatter = match ? match[1] : '';

            const parsedFrontmatter = frontmatter.split('\n').reduce((acc: Record<string, string>, line) => {
                const [key, value] = line.split(': ');
                if (key && value) {
                    acc[key.trim()] = value.trim().replace(/^['"]|['"]$/g, '');
                }
                return acc;
            }, {});

            const noteContent = content.replace(frontmatterRegex, '').trim();
            console.log('parsedFrontmatter.attachments:', parsedFrontmatter.attachments);
            return {
                fileName,
                content: noteContent,
                createdAt: parsedFrontmatter.createdAt,
                updatedAt: parsedFrontmatter.updatedAt,
                attachments: parsedFrontmatter.attachments ?
                    JSON.parse(parsedFrontmatter.attachments.replace(/([A-Za-z]:(?:\\|\/)[^"]+)\\(?=[^"]+)/g, '$1/')) :
                    [], // replace backslashes with forward slashes only for paths
            };
        });

        console.log('notesData:', notesData);

        event.reply('notes-data', notesData);
    });
});
