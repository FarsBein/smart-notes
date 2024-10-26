export class NotesError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = 'NotesError';
    }
}

export const ErrorCodes = {
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    FILE_READ_ERROR: 'FILE_READ_ERROR',
    FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
    METADATA_ERROR: 'METADATA_ERROR',
    INVALID_OPERATION: 'INVALID_OPERATION',
    EMBEDDING_ERROR: 'EMBEDDING_ERROR',
} as const;
