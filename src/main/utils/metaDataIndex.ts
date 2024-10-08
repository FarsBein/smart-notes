import fs from 'fs';
import { cosineSimilarity } from '../utils/embeddings';

class MetadataIndex {
    private indexPath: string;
    private embeddingsPath: string;
    private index: Record<string, NoteMetadata>;
    private embeddings: Record<string, number[]>;

    constructor(indexPath: string, embeddingsPath: string) {
        this.indexPath = indexPath;
        this.embeddingsPath = embeddingsPath;
        this.index = this.loadIndex();
        this.embeddings = this.loadEmbeddings();
    }

    private loadIndex(): Record<string, NoteMetadata> {
        try {
            const data = fs.readFileSync(this.indexPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading index:', error);
            return {};
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


    public addNote(metadata: NoteMetadata, embedding: number[]): void {
        this.index[metadata.fileName] = metadata; 
        this.saveIndex();

        this.embeddings[metadata.fileName] = embedding;
        this.saveEmbeddings();
    }

    public updateNoteMetadata(fileName: string, metadata: Partial<NoteMetadata>): void {
        if (this.index[fileName]) {
            this.index[fileName] = { ...this.index[fileName], ...metadata }; // pretty neat way to update only the changed properties
            this.saveIndex();
        }
    }

    public deleteNote(fileName: string): void {
        delete this.index[fileName];
        delete this.embeddings[fileName];
        this.saveIndex();
        this.saveEmbeddings();
    }
    
    public getNotesMetadata(): NoteMetadata[] {
        return Object.values(this.index).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    public getNoteMetadata(fileName: string): NoteMetadata | undefined {
        return this.index[fileName];
    }

    

    public searchSimilarNotes(queryEmbedding: number[], threshold: number = 0.8): NoteMetadata[] {
        const similarNotes: NoteMetadata[] = [];

        for (const [fileName, embedding] of Object.entries(this.embeddings)) {
            const similarity = cosineSimilarity(queryEmbedding, embedding);
            if (similarity >= threshold) {
                const noteMetadata = this.getNoteMetadata(fileName);
                if (noteMetadata) {
                    similarNotes.push(noteMetadata);
                }
            }
        }

        return similarNotes;
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
        return Object.values(this.index).filter(note =>
            note.title.toLowerCase().includes(lowercaseQuery) ||
            note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
    }
}

export default MetadataIndex;