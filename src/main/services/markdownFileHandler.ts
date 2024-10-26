import fs from 'fs/promises';
import path from 'path';
import { NotesError, ErrorCodes } from '../utils/errors';

export default class MarkdownFileHandler {
    private notesPath: string;

    constructor(notesPath: string) {
        this.notesPath = notesPath;
    }

    public async readFile(fileName: string): Promise<string> {
        const filePath = path.join(this.notesPath, fileName);
        try {
            return await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            console.error('Error reading file:', error);
            throw new NotesError(
                `Failed to read file ${fileName}: ${error.message}`,
                ErrorCodes.FILE_READ_ERROR
            );
        }
    }

    public async writeFile(fileName: string, content: string): Promise<void> {
        const filePath = path.join(this.notesPath, fileName);
        try {
            await fs.writeFile(filePath, content);
        } catch (error) {
            console.error('Error writing file:', error);
            throw new NotesError(
                `Failed to write file ${fileName}: ${error.message}`,
                ErrorCodes.FILE_WRITE_ERROR
            );
        }
    }

    public async deleteFile(fileName: string): Promise<void> {
        const filePath = path.join(this.notesPath, fileName);
        await fs.unlink(filePath);
    }

    public async updateContent(fileName: string, newContent: string): Promise<void> {
        const currentContent = await this.readFile(fileName);
        const frontmatter = currentContent.match(/^---[\s\S]*?---/)?.[0];
        const updatedContent = frontmatter + '\n' + newContent;
        await this.writeFile(fileName, updatedContent);
    }

    public async updateFrontmatter(fileName: string, frontmatter: string): Promise<void> {
        const currentContent = await this.readFile(fileName);
        const updatedContent = frontmatter + '\n' + currentContent;
        await this.writeFile(fileName, updatedContent);
    }

    public async updateTags(fileName: string, tags: string[]): Promise<void> {
        const content = await this.readFile(fileName);
        const updatedContent = content.replace(/tags: \[[^\]]*\]/, `tags: ${JSON.stringify(tags)}`);
        await this.writeFile(fileName, updatedContent);
    }

    public async getContent(fileName: string): Promise<string> {
        const content = await this.readFile(fileName);
        return content.replace(/^---[\s\S]*?---/, '').trim();
    }

    // not used yet ------------------------------------------------------------
    public async updateReplies(fileName: string, replies: string[]): Promise<void> {
        const content = await this.readFile(fileName);
        const updatedContent = content.replace(/replies: \[[^\]]*\]/, `replies: [${replies}]`);
        await this.writeFile(fileName, updatedContent);
    }   

    public async getFrontmatter(fileName: string): Promise<NoteMetadata> {
        const content = await this.readFile(fileName);
        const frontmatterString = content.match(/^---[\s\S]*?---/)?.[0] || '';

        const lines = frontmatterString.split('\n');
        const metadata: Partial<NoteMetadata> = { fileName, filePath: path.join(this.notesPath, fileName) };

        lines.forEach(line => {
            const [key, value] = line.split(':').map(part => part.trim());
            switch (key) {
                case 'title':
                case 'createdAt':
                case 'updatedAt':
                    metadata[key] = value.replace(/^'|'$/g, '');
                    break;
                case 'highlight':
                case 'highlightColor':
                    metadata[key] = value === 'null' ? null : value;
                    break;
                case 'tags':
                case 'replies':
                case 'attachments':
                case 'parentFileName':
                    metadata[key] = JSON.parse(value);
                    break;
                case 'isReply':
                case 'isAI':
                    metadata[key] = value === 'true';
                    break;
            }
        });

        return metadata as NoteMetadata;
    }
}
