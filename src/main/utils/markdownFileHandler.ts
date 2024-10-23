import fs from 'fs';
import path from 'path';

class MarkdownFileHandler {
    private notesPath: string;

    constructor(notesPath: string) {
        this.notesPath = notesPath;
    }

    public readFile(fileName: string): string {
        const filePath = path.join(this.notesPath, fileName);
        return fs.readFileSync(filePath, 'utf-8');
    }

    public writeFile(fileName: string, content: string): void {
        const filePath = path.join(this.notesPath, fileName);
        try {
            fs.writeFileSync(filePath, content);
        } catch (error) {
            console.error('Error writing file:', error);
        }
    }

    public deleteFile(fileName: string): void {
        const filePath = path.join(this.notesPath, fileName);
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }

    public updateContent(fileName: string, newContent: string): void {
        const currentContent = this.readFile(fileName);
        const frontmatter = currentContent.match(/^---[\s\S]*?---/)?.[0];
        const updatedContent = frontmatter + '\n' + newContent;
        this.writeFile(fileName, updatedContent);
    }

    public updateFrontmatter(fileName: string, frontmatter: string): void {
        const currentContent = this.readFile(fileName);
        const updatedContent = frontmatter + '\n' + currentContent;
        this.writeFile(fileName, updatedContent);
    }

    public updateTags(fileName: string, tags: string[]): void {
        const content = this.readFile(fileName);
        const updatedContent = content.replace(/tags: \[[^\]]*\]/, `tags: ${JSON.stringify(tags)}`);
        this.writeFile(fileName, updatedContent);
    }

    // not used yet ------------------------------------------------------------
    public updateReplies(fileName: string, replies: string[]): void {
        const content = this.readFile(fileName);
        const updatedContent = content.replace(/replies: \[[^\]]*\]/, `replies: [${replies}]`);
        this.writeFile(fileName, updatedContent);
    }   

}

export default MarkdownFileHandler;

