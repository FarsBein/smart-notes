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

// Save note to file
ipcMain.on('save-note', (event, noteContent, attachments) => {
    const currentDate = new Date();
    const year = String(currentDate.getFullYear()).slice(-2);
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const milliseconds = String(currentDate.getMilliseconds()).padStart(3, '0');
    const fileName = `${year}${month}${day}-${hours}${minutes}${seconds}.md`;

    const notesPath = path.join(
        app.getPath('documents'),
        'MyNotes',
    );

    const filePath = path.join(notesPath, fileName);
    const attachmentsDir = path.join(notesPath, 'attachments');

    // Ensure directories exist
    fs.mkdirSync(notesPath, { recursive: true });
    fs.mkdirSync(attachmentsDir, { recursive: true });

    // Process attachments
    let attachmentsMetadata = '';
    attachments.forEach((attachment: Attachment, index: number) => {
        switch (attachment.type) {
            case 'url':
                attachmentsMetadata += `${attachment.content}),`;
                break;
            case 'text':
                attachmentsMetadata += `"${attachment.content}",`;
                break;
            case 'image':
                const imgFileName = `image-${crypto.randomBytes(4).toString('hex')}.png`;
                const imgFilePath = path.join(attachmentsDir, imgFileName);
                fs.writeFileSync(imgFilePath, Buffer.from(attachment.content, 'base64'));
                attachmentsMetadata += `${notesPath}\\attachments\\${imgFileName},`;
                break;
        }
    });

    let metadata = `---\n` +
        `createdAt: '${currentDate.toISOString()}'\n` +
        `updatedAt: '${currentDate.toISOString()}'\n` +
        `attachments: [${attachmentsMetadata}]\n` +
        `---\n`;

    let fullNoteContent = metadata + noteContent ;

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

