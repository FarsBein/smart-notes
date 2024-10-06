import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your environment
});

// TODO: add generateEmbedding message for the user
export async function generateEmbedding(noteContent: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002', // Use the appropriate model for embeddings
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

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}
