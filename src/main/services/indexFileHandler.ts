import { NotesError, ErrorCodes } from '../utils/errors';
import { FileService } from '../utils/FileService';


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
interface IndexFileHandler {
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

class IndexFileHandler {
    private indexPath: string;
    private index: IndexFileHandler;
    private fileService: FileService;

    constructor(indexPath: string) {
        this.indexPath = indexPath;
        this.index = {} as IndexFileHandler;
        this.fileService = new FileService();

        this.loadIndex().then(index => this.index = index);
    }

    private async loadIndex(): Promise<IndexFileHandler> {
        try {
            const data = await this.fileService.readJsonFile<IndexFileHandler>(this.indexPath);
            return data;
        } catch (error) {
            console.error('Error loading index:', error);
            return {
                notes: {},
                replies: {},
                noteList: [],
                folderStructure: {
                    id: ['root'],
                    name: 'Root',
                    children: []
                },
                folderIndex: {},
                tagIndex: {}
            } as IndexFileHandler;
        }
    }

    private async saveIndex(): Promise<void> {
        try {
            await this.fileService.writeJsonFile(this.indexPath, this.index);
        } catch (error) {
            console.error('Error saving index:', error);
        }
    }

    public getParentNotesFileNames(): string[] {
        return this.index.noteList;
    }

    public async updateTags(fileName: string, updatedTags: string[]): Promise<string | null> {
        const metadata = this.index.notes[fileName] || this.index.replies[fileName];
        if (metadata) {
            const oldTags = metadata.tags;
            const tagsToAdd = updatedTags.filter(tag => !oldTags.includes(tag));
            const tagsToRemove = oldTags.filter(tag => !updatedTags.includes(tag));
            tagsToAdd.forEach(tag => this.addTag(tag, fileName));
            tagsToRemove.forEach(tag => this.removeTag(tag, fileName));
            if (tagsToAdd.length > 0 || tagsToRemove.length > 0) {
                await this.saveIndex();
            }
            return fileName;
        }
        console.error('Note/Reply not found:', fileName);
        return null;
    }

    public getIndexedTags(): string[] {
        return Object.keys(this.index.tagIndex);
    }

    private exclusiveTagSearch(tagIndex: Record<string, string[]>, tags: string[]): string[] {
        // Get the filenames for each tag, filter undefined, and sort by length for efficiency
        const listsOfFiles = tags
            .map(tag => tagIndex[tag])
            .filter(Boolean)
            .sort((a, b) => a.length - b.length);

        // Early exit if there are no valid tags or an empty list
        if (listsOfFiles.length === 0 || listsOfFiles[0].length === 0) return [];

        // Use a set for the smallest list and perform intersection with other lists
        const initialSet = new Set(listsOfFiles[0]);
        return listsOfFiles.slice(1).reduce((acc, currList) => {
            const currSet = new Set(currList);
            return acc.filter(file => currSet.has(file));
        }, Array.from(initialSet));
    }

    public getFilenamesThatContainsTags(tags: string[], inclusive: boolean = false): string[] {
        // get all the parent file names that contain the tags
        // this means if a reply has the tag, it will get the parent note and all its replies
        // if inclusive is true, do or operation where it gets all the file names that contain any of the tags
        let filenames: string[] = [];

        if (inclusive) {
            tags.forEach(tag => {
                const filenamesThatContainTag = this.index.tagIndex[tag];
                const parentFileNames = filenamesThatContainTag.map(fileName => this.index.replies[fileName]?.parentFileName || fileName);
                filenames.push(...parentFileNames);
            });
        } else {
            const filenamesThatContainTag = this.exclusiveTagSearch(this.index.tagIndex, tags);
            const parentFileNames = filenamesThatContainTag.map(fileName => this.index.replies[fileName]?.parentFileName || fileName);
            filenames = parentFileNames;
        }
        return [...new Set(filenames)];
    }

    public async deleteNote(fileName: string): Promise<void> {
        try {
            delete this.index.notes[fileName];
            this.index.noteList = this.index.noteList.filter(file => file !== fileName);
            await this.saveIndex();
        } catch (error) {
            console.error('Error in deleteNote:', error);
            throw new NotesError(
                `Failed to delete note ${fileName}: ${error.message}`,
                ErrorCodes.FILE_WRITE_ERROR
            );
        }
    }

    public async deleteReply(fileName: string): Promise<void> {
        try {
            const parentFileName = this.index.replies[fileName].parentFileName;
            this.index.notes[parentFileName].replies = this.index.notes[parentFileName].replies.filter(replyFileName => replyFileName !== fileName);
            delete this.index.replies[fileName];
            await this.saveIndex();
        } catch (error) {
            console.error('Error in deleteReply:', error);
            throw new NotesError(
                `Failed to delete reply ${fileName}: ${error.message}`,
                ErrorCodes.FILE_WRITE_ERROR
            );
        }
    }

    public async addNote(fileName: string, metadata: NoteMetadata): Promise<void> {
        this.index.notes[fileName] = metadata;
        this.index.noteList = [fileName, ...this.index.noteList];

        metadata.tags.forEach(tag => {
            this.addTag(tag, fileName);
        });

        await this.saveIndex();
    }

    public async addReply(fileName: string, metadata: NoteMetadata): Promise<void> {
        this.index.replies[fileName] = metadata;
        this.index.notes[metadata.parentFileName].replies.push(fileName);
        
        metadata.tags.forEach(tag => {
            this.addTag(tag, fileName);
        });

        await this.saveIndex();
    }

    public async updateMetadata(fileName: string, metadata: Partial<NoteMetadata>): Promise<string | null> {
        if (this.index.notes[fileName]) {
            this.index.notes[fileName] = { ...this.index.notes[fileName], ...metadata };
            await this.saveIndex();
            return fileName;
        } else if (this.index.replies[fileName]) {
            this.index.replies[fileName] = { ...this.index.replies[fileName], ...metadata };
            await this.saveIndex();
            return fileName;
        }
        return null;
    }

    public getParentFileNames(fileNamesWithRepliesAndParent: string[]): string[] {
        return fileNamesWithRepliesAndParent.map(fileName => 
            this.index.replies[fileName]?.parentFileName || fileName
        );
    }

    public updateNoteMetadata(fileName: string, metadata: Partial<NoteMetadata>): string | null {
        if (this.index.notes[fileName]) {
            this.index.notes[fileName] = { ...this.index.notes[fileName], ...metadata }; // pretty neat way to update only the changed properties
            this.saveIndex();
            return fileName;
        }
        return null;
    }

    public getMetadata(fileName: string): NoteMetadata {
        const metadata = this.index.notes[fileName] || this.index.replies[fileName];
        if (!metadata) {
            throw new NotesError(
                `Note not found: ${fileName}`,
                ErrorCodes.FILE_NOT_FOUND
            );
        }
        return metadata;
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

    public async deleteFileFromTags(fileName: string, tags: string[]): Promise<void> {
        tags.forEach(tag => {
            this.index.tagIndex[tag] = this.index.tagIndex[tag].filter(file => file !== fileName);
        });
        await this.saveIndex();
    }

    public async addTag(tag: string, fileName: string): Promise<boolean> {
        if (!this.index.tagIndex[tag]) {
            this.index.tagIndex[tag] = [];
        }
        if (!this.index.tagIndex[tag].includes(fileName)) {
            this.index.tagIndex[tag].push(fileName);

            const note = this.getMetadata(fileName);
            if (note && !note.tags.includes(tag)) {
                note.tags.push(tag);
            }

            await this.saveIndex();
            return true;
        }
        return false;
    }

    public async removeTag(tag: string, fileName: string): Promise<boolean> {
        if (this.index.tagIndex[tag]) {
            this.index.tagIndex[tag] = this.index.tagIndex[tag].filter(f => f !== fileName);
            if (this.index.tagIndex[tag].length === 0) {
                delete this.index.tagIndex[tag];
            }

            const note = this.getMetadata(fileName);
            if (note) {
                note.tags = note.tags.filter(t => t !== tag);
            }

            await this.saveIndex();
            return true;
        }
        return false;
    }

    // Not used yet ---------------------------------------------------------------
    public async addFolder(parentFolderId: string[], newFolderName: string): Promise<string[] | null> {
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
            await this.saveIndex();
            return newFolderId;
        }
        return null;
    }

    public async removeFolder(folderId: string[]): Promise<boolean> {
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
            await this.saveIndex();
            return true;
        }
        return false;
    }

    public async addNoteToFolder(fileName: string, folderId: string): Promise<boolean> {
        if (this.index.folderIndex[folderId]) {
            if (!this.index.folderIndex[folderId].includes(fileName)) {
                this.index.folderIndex[folderId].push(fileName);
                await this.saveIndex();
                return true;
            }
        }
        return false;
    }

    public async removeNoteFromFolder(fileName: string, folderId: string): Promise<boolean> {
        if (this.index.folderIndex[folderId]) {
            this.index.folderIndex[folderId] = this.index.folderIndex[folderId].filter(f => f !== fileName);
            await this.saveIndex();
            return true;
        }
        return false;
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
}

export default IndexFileHandler;
