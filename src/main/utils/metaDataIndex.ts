import fs from 'fs';
import { cosineSimilarity } from '../utils/embeddings';

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
    "noteList": ["xxxxxx-xxxxxx"] // has notes filenames (no replies)
    }
*/
interface Index {  
    notes: Record<string, NoteMetadata>;
    replies: Record<string, NoteMetadata>;
    noteList: string[];
}

class MetadataIndex {
    private indexPath: string;
    private embeddingsPath: string;
    // create a type for the index base on the json structure
    
    private index: Index;
    private embeddings: Record<string, number[]>;

    constructor(indexPath: string, embeddingsPath: string) {
        this.indexPath = indexPath;
        this.embeddingsPath = embeddingsPath;
        this.index = this.loadIndex();
        this.embeddings = this.loadEmbeddings();
    }

    private loadIndex(): Index {
        try {
            const data = fs.readFileSync(this.indexPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading index:', error);
            return { notes: {}, replies: {}, noteList: [] };
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

    public updateReplyContent(fileName: string, newContent: string): string | null {
        if (this.index.replies[fileName]) {
            this.updateContent(fileName, newContent);
            this.saveIndex();
            return fileName;
        } 
        console.error('Reply not found:', fileName);
        return null;
    }

    public updateNoteContent(fileName: string, newContent: string): string | null {
        if (this.index.notes[fileName]) {
            this.updateContent(fileName, newContent);
            this.saveIndex();
            return fileName;
        } 
        console.error('Note not found:', fileName);
        return null;
    }

    public updateContent(fileName: string, newContent: string): string | null {
        // TODO: switch to just concatenating new content to existing frontmatter
        try {
            const note = this.getNoteMetadata(fileName);
            if (!note) throw new Error('Note not found');
            let fullNoteContent = fs.readFileSync(note.filePath, 'utf-8');
            const oldContent = fullNoteContent.replace(/^---[\s\S]*?---/, '').trim()
            
            // Update the note content
            const updatedAt = new Date().toISOString();
            fullNoteContent = fullNoteContent.replace(oldContent, newContent);
            fs.writeFileSync(note.filePath, fullNoteContent);
    
            // Update metadata
            this.updateNoteMetadata(fileName, { updatedAt });
    
            return fileName;
        } catch (error) {
            console.error('Failed to update note:', error);
            return null;
        }
    }

    public deleteNote(fileName: string): void {
        if (this.index.notes[fileName]) {
            try {
                fs.unlinkSync(this.index.notes[fileName].filePath);
            } catch (error) {
                console.error('Error deleting note:', error);
                return;
            }
            delete this.index.notes[fileName];
            this.index.noteList = this.index.noteList.filter(file => file !== fileName);
            this.saveIndex();

            delete this.embeddings[fileName];
            this.saveEmbeddings();
        }
    }

    public deleteReply(fileName: string): void {
        if (this.index.replies[fileName]) {
            try {
                fs.unlinkSync(this.index.replies[fileName].filePath);
            } catch (error) {
                console.error('Error deleting reply:', error);
                return;
            }
            delete this.index.replies[fileName];
            const parentFileName = this.index.replies[fileName].parentFileName;
            this.index.notes[parentFileName].replies = this.index.notes[parentFileName].replies.filter(replyFileName => replyFileName !== fileName);
            this.saveIndex();

            delete this.embeddings[fileName];
            this.saveEmbeddings();
        }
    }

    public addNote(metadata: NoteMetadata, embedding: number[]): void {
        this.index.notes[metadata.fileName] = metadata; 
        this.index.noteList.push(metadata.fileName);
        this.saveIndex();

        this.embeddings[metadata.fileName] = embedding;
        this.saveEmbeddings();

        // update the file with new frontmatter
        const newFrontmatter = this.toFrontmatterString(metadata.fileName);
        const content = fs.readFileSync(metadata.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim();
        const newContent = newFrontmatter + content;
        fs.writeFileSync(metadata.filePath, newContent);
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
    
    public getIndexes(): Index {
        return this.index;
    }

    public getParentIndexes(): (NoteMetadata)[] {
        return Object.values(this.index.notes).map(note => {
                if (note.replies) {
                    const replies = note.replies.map(reply => this.index.replies[reply].fileName);
                    const NoteMetadata: NoteMetadata = { ...note, replies: replies };
                    return NoteMetadata;
                }
                return note;
            }).filter(note => note !== null).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    public getNotesMetadata(): NoteMetadata[] {
        return Object.values(this.index.notes).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    public getParentNotesMetadata(): NoteMetadata[] {
        return Object.values(this.index.notes).filter(note => !note.isReply).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    public getNoteMetadata(fileName: string): NoteMetadata | undefined {
        return this.index.notes[fileName];
    }

    public getMetadata(fileName: string): NoteMetadata | undefined {
        return this.index.notes[fileName] || this.index.replies[fileName];
    }

    
    
    // unused for now ---------------------------------------------------------------
    public getNoteContent(fileName: string): string | null {
        const note = this.getNoteMetadata(fileName);
        if (!note) return null;
        return fs.readFileSync(note.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim();
    }

    public toFrontmatterString(fileName: string): string | null {
        const note = this.getNoteMetadata(fileName);
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
        const note = this.getNoteMetadata(fileName);
        if (!note) return null;
        try {
            return fs.readFileSync(note.filePath, 'utf-8').replace(/^---[\s\S]*?---/, '').trim();
        } catch (error) {
            console.error('Error reading note content:', error);
            return null;
        }
    }
}

export default MetadataIndex;