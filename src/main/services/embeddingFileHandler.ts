import { FileService } from '../utils/FileService';
import { cosineSimilarity, generateEmbedding } from '../utils/embeddings';
import { NotesError, ErrorCodes } from '../utils/errors';

export default class EmbeddingFileHandler {
    private embeddingsPath: string;
    private embeddings: Record<string, number[]>;
    private fileService: FileService;

    constructor(embeddingsPath: string) {
        this.embeddingsPath = embeddingsPath;
        this.embeddings = {};
        this.fileService = new FileService();
        this.loadEmbeddings();
    }

    private async loadEmbeddings(): Promise<void> {
        try {
            this.embeddings = await this.fileService.readJsonFile(this.embeddingsPath) || {};
        } catch (error) {
            console.error('Error loading embeddings:', error);
            this.embeddings = {};
        }
    }

    public async saveEmbeddings(): Promise<void> {
        try {
            await this.fileService.writeJsonFile(this.embeddingsPath, this.embeddings);
        } catch (error) {
            throw new NotesError(
                `Failed to save embeddings: ${error.message}`,
                ErrorCodes.FILE_WRITE_ERROR
            );
        }
    }

    public async addEmbedding(fileName: string, content: string): Promise<void> {
        try {
            const embedding = await generateEmbedding(content);
            this.embeddings[fileName] = embedding;
            await this.saveEmbeddings();
        } catch (error) {
            throw new NotesError(
                `Failed to add embedding for ${fileName}: ${error.message}`,
                ErrorCodes.EMBEDDING_ERROR
            );
        }
    }

    public async deleteEmbedding(fileName: string, saveImmediately: boolean = true): Promise<void> {
        delete this.embeddings[fileName];
        if (saveImmediately) {
            await this.saveEmbeddings();
        }
    }

    public async searchSimilar(queryEmbedding: string, threshold: number = 0.8): Promise<string[]> {
        const queryEmbeddingArray = await generateEmbedding(queryEmbedding);
        return Object.entries(this.embeddings)
            .filter(([_, embedding]) => cosineSimilarity(queryEmbeddingArray, embedding) >= threshold)
            .map(([fileName, _]) => fileName);
    }
}
