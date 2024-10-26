import fs from 'fs/promises';
import { NotesError, ErrorCodes } from './errors';

export class FileService {
    public async readJsonFile<T>(filePath: string): Promise<T> {
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            throw new NotesError(
                `Failed to read JSON file ${filePath}: ${error.message}`,
                ErrorCodes.FILE_READ_ERROR
            );
        }
    }

    public async writeJsonFile<T>(filePath: string, data: T): Promise<void> {
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            throw new NotesError(
                `Failed to write JSON file ${filePath}: ${error.message}`,
                ErrorCodes.FILE_WRITE_ERROR
            );
        }
    }
}
