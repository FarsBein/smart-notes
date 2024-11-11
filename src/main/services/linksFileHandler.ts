import { FileService } from '../utils/FileService';
import { NotesError, ErrorCodes } from '../utils/errors';



export default class LinksFileHandler {
    private linksPath: string;
    private links: Record<string, LinkMetadata>;
    private fileService: FileService;
    private initialized: boolean = false;
    private CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    constructor(linksPath: string) {
        this.linksPath = linksPath;
        this.fileService = new FileService();
        this.links = {};
        this.initialize();
    }

    private async initialize() {
        if (!this.initialized) {
            await this.loadLinks();
            this.initialized = true;
        }
    }

    private async loadLinks(): Promise<void> {
        try {
            this.links = await this.fileService.readJsonFile(this.linksPath);
        } catch (error) {
            console.log(`Creating new links file at ${this.linksPath}`);
            this.links = {};
            await this.saveLinks();
        }
    }

    private async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
        }
    }

    public async saveLinks(): Promise<void> {
        await this.ensureInitialized();
        try {
            await this.fileService.writeJsonFile(this.linksPath, this.links);
        } catch (error) {
            throw new NotesError(
                `Failed to save links: ${error.message}`,
                ErrorCodes.FILE_WRITE_ERROR
            );
        }
    }

    public async addLink(url: string, metadata: Omit<LinkMetadata, 'lastFetched'>): Promise<void> {
        await this.ensureInitialized();
        this.links[url] = {
            ...metadata,
            lastFetched: Date.now()
        };
        await this.saveLinks();
    }

    public async getLink(url: string): Promise<LinkMetadata | null> {
        await this.ensureInitialized();
        const linkData = this.links[url];
        
        if (!linkData) {
            return null;
        }

        // Check if cache is expired
        const now = Date.now();
        if (now - linkData.lastFetched > this.CACHE_DURATION) {
            return null;
        }

        return linkData;
    }

    public async removeLink(url: string): Promise<void> {
        await this.ensureInitialized();
        if (this.links[url]) {
            delete this.links[url];
            await this.saveLinks();
        }
    }

    public async clearExpiredLinks(): Promise<void> {
        await this.ensureInitialized();
        const now = Date.now();
        
        Object.entries(this.links).forEach(([url, data]) => {
            if (now - data.lastFetched > this.CACHE_DURATION) {
                delete this.links[url];
            }
        });

        await this.saveLinks();
    }
}
