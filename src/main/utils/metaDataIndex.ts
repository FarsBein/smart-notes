import fs from 'fs';
import { cosineSimilarity } from '../utils/embeddings';

class MetadataIndex {
    private indexPath: string;
    private embeddingsPath: string;
    private index: NoteMetadata[];
    private embeddings: Record<string, number[]>;

    constructor(indexPath: string, embeddingsPath: string) {
        this.indexPath = indexPath;
        this.embeddingsPath = embeddingsPath;
        this.index = this.loadIndex();
        this.embeddings = this.loadEmbeddings();
    }

    private loadIndex(): NoteMetadata[] {
        try {
            const data = fs.readFileSync(this.indexPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading index:', error);
            return [];
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

    //TODO: change to storing notes in obj of objs instead of array
    public addNote(metadata: NoteMetadata): void {
        // this.index.unshift(metadata); // O(N) speed moves the whole array gets worst with more notes
        this.index = [metadata, ...this.index]; // O(1) speed but worst memory consumption while processing
        this.saveIndex();
    }

    public addNoteWithEmbedding(metadata: NoteMetadata, embedding: number[]): void {
        this.addNote(metadata);
        this.embeddings[metadata.fileName] = embedding;
        this.saveEmbeddings();
    }

    public updateNote(fileName: string, metadata: Partial<NoteMetadata>): void {
        const noteIndex = this.index.findIndex(note => note.fileName === fileName);
        if (noteIndex !== -1) {
            this.index[noteIndex] = { ...this.index[noteIndex], ...metadata };
            this.saveIndex();
        }
    }

    public deleteNote(fileName: string): void {
        this.index = this.index.filter(note => note.fileName !== fileName);
        this.saveIndex();
    }

    public getNotes(): NoteMetadata[] {
        return this.index;
    }

    public searchNotes(query: string): NoteMetadata[] {
        const lowercaseQuery = query.toLowerCase();
        return this.index.filter(note =>
            note.title.toLowerCase().includes(lowercaseQuery) ||
            note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
    }

    public getNoteMetadata(fileName: string): NoteMetadata | undefined {
        return this.index.find(note => note.fileName === fileName);
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
}

export default MetadataIndex;