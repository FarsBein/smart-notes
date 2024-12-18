import OpenAI from 'openai';
import { loadConfig } from '../config';

let openai: OpenAI;

// Initialize OpenAI client with the API key from config
async function initializeOpenAI() {
    const config = await loadConfig();
    openai = new OpenAI({
        apiKey: config.openAiKey,
    });
}

export async function generateEmbedding(noteContent: string): Promise<number[]> {
    if (!openai) {
        await initializeOpenAI();
    }

    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: noteContent,
        });

        if (response.data && response.data.length > 0) {
            return response.data[0].embedding;
        } else {
            throw new Error('Failed to generate embedding');
        }
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
}

// returns a value between -1 and 1
// better than euclidean/diffing distance because it takes the direction into account
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}
