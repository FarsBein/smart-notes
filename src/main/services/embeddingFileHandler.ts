import { FileService } from '../utils/FileService';
import { cosineSimilarity, generateEmbedding } from '../utils/embeddings';
import { NotesError, ErrorCodes } from '../utils/errors';

export default class EmbeddingFileHandler {
    private embeddingsPath: string;
    private embeddings: Record<string, number[]>;
    private fileService: FileService;
    private initialized: boolean = false;

    constructor(embeddingsPath: string) {
        this.embeddingsPath = embeddingsPath;
        this.embeddings = {};
        this.fileService = new FileService();
        this.initialize();
    }

    private async initialize() {
        if (!this.initialized) {
            await this.loadEmbeddings();
            this.initialized = true;
        }
    }

    private async loadEmbeddings(): Promise<void> {
        try {
            // Try to read existing embeddings file
            this.embeddings = await this.fileService.readJsonFile(this.embeddingsPath);
        } catch (error) {
            console.log(`No existing embeddings file found at ${this.embeddingsPath}, creating new one`);
            
            // Create default embeddings structure
            this.embeddings = {};

            // Write the default embeddings to file
            try {
                await this.fileService.writeJsonFile(this.embeddingsPath, this.embeddings);
            } catch (writeError) {
                console.error('Error creating new embeddings file:', writeError);
                throw new NotesError(
                    `Failed to create embeddings file: ${writeError.message}`,
                    ErrorCodes.FILE_WRITE_ERROR
                );
            }
        }
    }

    private async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
        }
    }

    public async saveEmbeddings(): Promise<void> {
        await this.ensureInitialized();
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
        await this.ensureInitialized();
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
        await this.ensureInitialized();
        delete this.embeddings[fileName];
        if (saveImmediately) {
            await this.saveEmbeddings();
        }
    }

    public async searchSimilar(queryEmbedding: string, threshold: number = 0.8): Promise<string[]> {
        await this.ensureInitialized();
        const queryEmbeddingArray = await generateEmbedding(queryEmbedding);
        return Object.entries(this.embeddings)
            .filter(([_, embedding]) => cosineSimilarity(queryEmbeddingArray, embedding) >= threshold)
            .map(([fileName, _]) => fileName);
    }
}
