import fs from 'fs';
import { cosineSimilarity } from '../utils/embeddings';
import MarkdownFileHandler from './markdownFileHandler';

// multi line comment
/*
    the structure of the metadata index is as follows:
    {
        "notes": {
            "xxxxxx-xxxxxx": {
            "id": "xxxxxx-xxxxxx",
            "filePath": "C:\\Users\\Fars\\Documents\\MyNotes\\xxxxxx-xxxxxx.md",
            "createdAt": "xxxxxx-xxxxxx",
            "updatedAt": "xxxxxx-xxxxxx",
            "highlight": null,
            "highlightColor": null,
            "tags": [],
            "attachments": [],
            "replies": ["xxxxxx-xxxxxx"],
            "parentFileName": "",
            "isReply": false,
            "isAI": false
            }
        },
        "replies": {
            "xxxxxx-xxxxxx": {
            "id": "xxxxxx-xxxxxx",
            "filePath": "C:\\Users\\Fars\\Documents\\MyNotes\\xxxxxx-xxxxxx.md",
            "createdAt": "xxxxxx-xxxxxx",
            "updatedAt": "xxxxxx-xxxxxx",
            "highlight": null,
            "highlightColor": null,
            "tags": [],
            "attachments": [],
            "parentFileName": "xxxxxx-xxxxxx",
            "replies": ["xxxxxx-xxxxxx"],
            "isReply": true,
            "isAI": false
            }
        },
        "noteList": ["xxxxxx-xxxxxx"], // has notes filenames (no replies)
        "folderStructure": {
            "id": ["root"],
            "name": "Root",
            "children": [
                {
                    "id": ["root", "projects"],
                    "name": "Projects",
                    "children": [
                        {
                            "id": ["root", "projects", "new app"],
                            "name": "New App",
                            "children": []
                        }
                    ]
                }
            ]
        },
        "folderIndex": {
            "projects": ["241016-234345"],
            "projects/new app": ["241016-234345", "241016-234656"],
            "morning": []
        },
        "tagIndex": {
            "ideas": ["241016-234345"],
            "screenshots": ["241016-234345"],
            "feedback": ["241016-234656"]
        }
    }
*/
interface Index {
    notes: Record<string, NoteMetadata>;
    replies: Record<string, NoteMetadata>;
    noteList: string[];
    folderStructure: FolderStructure;
    folderIndex: Record<string, string[]>;
    tagIndex: Record<string, string[]>;
}

interface FolderStructure {
    id: string[];
    name: string;
    children: FolderStructure[];
}

class MetadataIndex {
    private indexPath: string;
    private embeddingsPath: string;
    private index: Index;
    private embeddings: Record<string, number[]>;
    private markdownHandler: MarkdownFileHandler;

    constructor(indexPath: string, embeddingsPath: string, notesPath: string) {
        this.indexPath = indexPath;
        this.embeddingsPath = embeddingsPath;
        this.index = this.loadIndex();
        this.embeddings = this.loadEmbeddings();
        this.markdownHandler = new MarkdownFileHandler(notesPath);
    }

    private loadIndex(): Index {
        try {
            const data = fs.readFileSync(this.indexPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading index:', error);
            return { notes: {}, replies: {}, noteList: [], folderStructure: { id: ['root'], name: 'Root', children: [] }, folderIndex: {}, tagIndex: {} };
        }
    }

    private loadEmbeddings(): Record<string, number[]> {
        try {
            const data = fs.readFileSync(this.embeddingsPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading embeddings:', error);
            return {};
        }
    }

    private saveIndex(): void {
        try {
            fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
        } catch (error) {
            console.error('Error saving index:', error);
        }
    }

    private saveEmbeddings(): void {
        try {
            fs.writeFileSync(this.embeddingsPath, JSON.stringify(this.embeddings, null, 2));
        } catch (error) {
            console.error('Error saving embeddings:', error);
        }
    }

    public getParentNotesFileNames(): string[] {
        return this.index.noteList;
    }

    public updateTags(fileName: string, updatedTags: string[]): string | null {
        const metadata = this.index.notes[fileName] || this.index.replies[fileName];
        if (metadata) {
            const oldTags = metadata.tags;
            const tagsToAdd = updatedTags.filter(tag => !oldTags.includes(tag));
            const tagsToRemove = oldTags.filter(tag => !updatedTags.includes(tag));
            tagsToAdd.forEach(tag => this.addTag(tag, fileName));
            tagsToRemove.forEach(tag => this.removeTag(tag, fileName));
            if (tagsToAdd.length > 0 || tagsToRemove.length > 0) {
                this.saveIndex();
            }
            return fileName;
        } 
        console.error('Note/Reply not found:', fileName);
        return null;
    }

    public deleteNote(fileName: string): void {
        if (this.index.notes[fileName]) {
            this.markdownHandler.deleteFile(fileName);
            // delete all replies to this note
            this.index.notes[fileName].replies.forEach(reply => {
                try {
                    this.markdownHandler.deleteFile(reply);
                } catch (error) {
                    console.error('Error deleting reply:', error);
                }
                delete this.index.replies[reply];
                delete this.embeddings[reply];
                this.removeFromTagsAndFolders(reply);
            });

            delete this.index.notes[fileName];
            this.index.noteList = this.index.noteList.filter(file => file !== fileName);
            
            delete this.embeddings[fileName];
            this.removeFromTagsAndFolders(fileName);

            this.saveIndex();
            this.saveEmbeddings();
        }
    }

    public deleteReply(fileName: string): void {
        if (this.index.replies[fileName]) {
            this.markdownHandler.deleteFile(fileName);
            const parentFileName = this.index.replies[fileName].parentFileName;
            this.index.notes[parentFileName].replies = this.index.notes[parentFileName].replies.filter(replyFileName => replyFileName !== fileName);
            this.removeFromTagsAndFolders(fileName);
            delete this.index.replies[fileName];
            this.saveIndex();

            delete this.embeddings[fileName];
            this.saveEmbeddings();
        } else {
            console.error('Reply not found:', fileName);
        }
    }

    public addNote(metadata: NoteMetadata, embedding: number[]): void {
        this.index.notes[metadata.fileName] = metadata;
        this.index.noteList.push(metadata.fileName);

        metadata.tags.forEach(tag => {
            this.addTag(tag, metadata.fileName);
        });

        this.embeddings[metadata.fileName] = embedding;

        this.saveIndex();
        this.saveEmbeddings();
    }

    public addReply(metadata: NoteMetadata, embedding: number[]): void {
        // add the reply to the index
        this.index.replies[metadata.fileName] = metadata;
        // add the reply to the parent note
        this.index.notes[metadata.parentFileName].replies.push(metadata.fileName);
        // add the tags to the index
        metadata.tags.forEach(tag => {
            this.addTag(tag, metadata.fileName);
        });
        this.saveIndex();

        this.embeddings[metadata.fileName] = embedding;
        this.saveEmbeddings();
    }

    public updateMetadata(fileName: string, metadata: Partial<NoteMetadata>): string | null {
        if (this.index.notes[fileName]) {
            this.index.notes[fileName] = { ...this.index.notes[fileName], ...metadata };
            this.saveIndex();
            return fileName;
        } else if (this.index.replies[fileName]) {
            this.index.replies[fileName] = { ...this.index.replies[fileName], ...metadata };
            this.saveIndex();
            return fileName;
        }
        return null;
    }

    public searchSimilarNotes(queryEmbedding: number[], threshold: number = 0.8): string[] {
        const similarNotes: string[] = [];

        for (const [fileName, embedding] of Object.entries(this.embeddings)) {
            const similarity = cosineSimilarity(queryEmbedding, embedding);
            if (similarity >= threshold) {
                if (this.index.replies[fileName]) {
                    similarNotes.push(this.index.replies[fileName].parentFileName);
                } else {
                    similarNotes.push(fileName);
                }
            }
        }

        return similarNotes;
    }

    public updateNoteMetadata(fileName: string, metadata: Partial<NoteMetadata>): string | null {
        if (this.index.notes[fileName]) {
            this.index.notes[fileName] = { ...this.index.notes[fileName], ...metadata }; // pretty neat way to update only the changed properties
            this.saveIndex();
            return fileName;
        }
        return null;
    }

    public getMetadata(fileName: string): NoteMetadata | undefined {
        return this.index.notes[fileName] || this.index.replies[fileName];
    }

    public toFrontmatterString(fileName: string): string | null {
        const note = this.getMetadata(fileName);
        if (!note) return null;

        return `---\n` +
            `title: '${note.title}'\n` +
            `createdAt: '${note.createdAt}'\n` +
            `updatedAt: '${note.updatedAt}'\n` +
            `highlight: ${note.highlight}\n` +
            `highlightColor: ${note.highlightColor}\n` +
            `tags: [${note.tags.join(', ')}]\n` +
            `replies: [${note.replies.join(', ')}]\n` +
            `attachments: [${note.attachments.join(', ')}]\n` +
            `parentFileName: ${note.parentFileName}\n` +
            `isReply: ${note.isReply}\n` +
            `isAI: ${note.isAI}\n` +
            `---\n`;
    }

    private removeFromTagsAndFolders(fileName: string): void {
        // Remove from tags
        Object.keys(this.index.tagIndex).forEach(tag => {
            this.index.tagIndex[tag] = this.index.tagIndex[tag].filter(file => file !== fileName);
            if (this.index.tagIndex[tag].length === 0) {
                delete this.index.tagIndex[tag];
            }
        });

        // Remove from folders
        Object.keys(this.index.folderIndex).forEach(folder => {
            this.index.folderIndex[folder] = this.index.folderIndex[folder].filter(file => file !== fileName);
            if (this.index.folderIndex[folder].length === 0) {
                delete this.index.folderIndex[folder];
            }
        });
    }

    public addTag(tag: string, fileName: string): boolean {
        if (!this.index.tagIndex[tag]) {
            this.index.tagIndex[tag] = [];
        }
        if (!this.index.tagIndex[tag].includes(fileName)) {
            this.index.tagIndex[tag].push(fileName);
            
            // Also update the note's metadata
            const note = this.getMetadata(fileName);
            if (note && !note.tags.includes(tag)) {
                note.tags.push(tag);
            }
            
            this.saveIndex();
            return true;
        }
        return false;
    }

    public removeTag(tag: string, fileName: string): boolean {
        if (this.index.tagIndex[tag]) {
            this.index.tagIndex[tag] = this.index.tagIndex[tag].filter(f => f !== fileName);
            if (this.index.tagIndex[tag].length === 0) {
                delete this.index.tagIndex[tag];
            }
            
            // Also update the note's metadata
            const note = this.getMetadata(fileName);
            if (note) {
                note.tags = note.tags.filter(t => t !== tag);
            }
            
            this.saveIndex();
            return true;
        }
        return false;
    }

    // Not used yet ---------------------------------------------------------------
    public getNoteContent(fileName: string): string | null {
        const note = this.getMetadata(fileName);
        if (!note) return null;
        return fs.readFileSync(note.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim();
    }

    public static fromFrontmatterString(fileName: string, frontmatter: string, filePath: string): NoteMetadata {
        const lines = frontmatter.split('\n');
        const metadata: Partial<NoteMetadata> = { fileName, filePath };

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

    public getEmbedding(fileName: string): number[] | undefined {
        return this.embeddings[fileName];
    }

    public searchTagsAndTitles(query: string): NoteMetadata[] {
        const lowercaseQuery = query.toLowerCase();
        return Object.values(this.index.notes).filter(note =>
            note.title.toLowerCase().includes(lowercaseQuery) ||
            note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
    }

    public getContent(fileName: string): string | null {
        const note = this.getMetadata(fileName);
        if (!note) return null;
        try {
            return fs.readFileSync(note.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim();
        } catch (error) {
            console.error('Error reading note content:', error);
            return null;
        }
    }
    
    public addFolder(parentFolderId: string[], newFolderName: string): string[] | null {
        const newFolderId = [...parentFolderId, newFolderName];
        const newFolder: FolderStructure = {
            id: newFolderId,
            name: newFolderName,
            children: []
        };

        const addFolderRecursive = (folder: FolderStructure): boolean => {
            if (JSON.stringify(folder.id) === JSON.stringify(parentFolderId)) {
                folder.children.push(newFolder);
                return true;
            }
            for (const child of folder.children) {
                if (addFolderRecursive(child)) {
                    return true;
                }
            }
            return false;
        };

        if (addFolderRecursive(this.index.folderStructure)) {
            const folderPath = newFolderId.join('/');
            this.index.folderIndex[folderPath] = [];
            this.saveIndex();
            return newFolderId;
        }
        return null;
    }

    public removeFolder(folderId: string[]): boolean {
        const removeFolderRecursive = (folder: FolderStructure, parentFolder: FolderStructure | null): boolean => {
            if (JSON.stringify(folder.id) === JSON.stringify(folderId)) {
                if (parentFolder) {
                    parentFolder.children = parentFolder.children.filter(child => JSON.stringify(child.id) !== JSON.stringify(folderId));
                } else {
                    // Trying to remove root folder, which is not allowed
                    return false;
                }
                const folderPath = folderId.join('/');
                delete this.index.folderIndex[folderPath];
                return true;
            }
            for (const child of folder.children) {
                if (removeFolderRecursive(child, folder)) {
                    return true;
                }
            }
            return false;
        };

        if (removeFolderRecursive(this.index.folderStructure, null)) {
            this.saveIndex();
            return true;
        }
        return false;
    }

    public addNoteToFolder(fileName: string, folderId: string): boolean {
        if (this.index.folderIndex[folderId]) {
            if (!this.index.folderIndex[folderId].includes(fileName)) {
                this.index.folderIndex[folderId].push(fileName);
                this.saveIndex();
                return true;
            }
        }
        return false;
    }

    public removeNoteFromFolder(fileName: string, folderId: string): boolean {
        if (this.index.folderIndex[folderId]) {
            this.index.folderIndex[folderId] = this.index.folderIndex[folderId].filter(f => f !== fileName);
            this.saveIndex();
            return true;
        }
        return false;
    }
}

export default MetadataIndex;
