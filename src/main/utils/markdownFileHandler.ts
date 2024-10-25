import fs from 'fs/promises';
import path from 'path';

class MarkdownFileHandler {
    private notesPath: string;

    constructor(notesPath: string) {
        this.notesPath = notesPath;
    }

    public async readFile(fileName: string): Promise<string> {
        const filePath = path.join(this.notesPath, fileName);
        return await fs.readFile(filePath, 'utf-8');
    }

    public async writeFile(fileName: string, content: string): Promise<void> {
        const filePath = path.join(this.notesPath, fileName);
        await fs.writeFile(filePath, content);
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

    // not used yet ------------------------------------------------------------
    public async updateReplies(fileName: string, replies: string[]): Promise<void> {
        const content = await this.readFile(fileName);
        const updatedContent = content.replace(/replies: \[[^\]]*\]/, `replies: [${replies}]`);
        await this.writeFile(fileName, updatedContent);
    }   

}

export default MarkdownFileHandler;
