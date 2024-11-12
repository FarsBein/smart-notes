import { ipcMain } from 'electron';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { linksFileHandler } from './file';

ipcMain.handle('get-link-preview', async (_, url: string) => {
    try {
        // First check if we have a cached version
        const cachedData = await linksFileHandler.getLink(url);
        if (cachedData) {
            return cachedData;
        }

        // If not cached or expired (not yet implemented), fetch new data
        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
        let previewData;
        
        if (isYouTube) {
            previewData = await getYouTubePreview(url);
        } else {
            previewData = await getGeneralPreview(url);
        }

        // Cache the new data
        await linksFileHandler.addLink(url, previewData);
        return previewData;
    } catch (error) {
        console.error('Error fetching link preview');
        return getFallbackPreview();
    }
});

ipcMain.handle('remove-link-preview', async (_, url: string) => {
    try {
        await linksFileHandler.removeLink(url);
        return true;
    } catch (error) {
        console.error('Error removing link preview:', error);
        return false;
    }
});

async function getYouTubePreview(url: string): Promise<LinkMetadata> {
    const videoId = extractYouTubeVideoId(url);
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    const data = await response.json();
    const { title, author_name } = data as { title: string, author_name: string };
    
    return {
        title,
        description: `Video by ${author_name}`,
        imageUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        type: 'video',
        siteName: 'YouTube',
        lastFetched: Date.now()
    };
}

async function getGeneralPreview(url: string): Promise<LinkMetadata> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        // Only process HTML responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/html')) {
            return getFallbackPreview();
        }

        const html = await response.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        
        const metadata = {
            ...getTwitterCardData(doc),
            ...getOpenGraphData(doc),
            ...getSchemaOrgData(doc),
            ...getBasicMetaData(doc),
            favicon: getFavicon(doc, url)
        };

        const urlTitle = new URL(url).hostname.replace('www.', '');
        
        // Generate a random hex color for the placeholder image
        const randomColor = Math.floor(Math.random()*5);
        const color = ["A2AAAD", "FF2D55", "34C759", "007AFF", "FFCC00"][randomColor]; 
        const placeholderImage = `https://placehold.co/600x400/${color}/ffffff?text=${encodeURIComponent(urlTitle)}`;

        return {
            title: metadata.title || urlTitle,
            description: metadata.description || '',
            imageUrl: metadata.imageUrl || placeholderImage,
            siteName: metadata.siteName,
            favicon: metadata.favicon,
            type: metadata.type,
            lastFetched: Date.now()
        };
    } catch (error) {
        console.error('Error in getGeneralPreview');
        return getFallbackPreview();
    }
}

function getOpenGraphData(doc: Document): Partial<LinkMetadata> {
    return {
        title: doc.querySelector('meta[property="og:title"]')?.getAttribute('content'),
        description: doc.querySelector('meta[property="og:description"]')?.getAttribute('content'),
        imageUrl: doc.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        siteName: doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content'),
        type: doc.querySelector('meta[property="og:type"]')?.getAttribute('content')
    };
}

function getTwitterCardData(doc: Document): Partial<LinkMetadata> {
    return {
        title: doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
        description: doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content'),
        imageUrl: doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
    };
}

function getSchemaOrgData(doc: Document): Partial<LinkMetadata> {
    const ldJson = doc.querySelector('script[type="application/ld+json"]')?.textContent;
    if (ldJson) {
        try {
            const data = JSON.parse(ldJson);
            return {
                title: data.headline || data.name,
                description: data.description,
                imageUrl: data.image?.url || data.image,
                siteName: data.publisher?.name,
                lastFetched: Date.now()
            };
        } catch (e) {
            console.error('Error parsing LD+JSON');
        }
    }
    return {};
}

function getBasicMetaData(doc: Document): Partial<LinkMetadata> {
    return {
        title: doc.querySelector('title')?.textContent ||
               doc.querySelector('meta[name="title"]')?.getAttribute('content'),
        description: doc.querySelector('meta[name="description"]')?.getAttribute('content'),
        imageUrl: doc.querySelector('link[rel="image_src"]')?.getAttribute('href')
    };
}

function getFavicon(doc: Document, baseUrl: string): string {
    const favicon = doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
                   doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
                   '/favicon.ico';
    
    try {
        const url = new URL(favicon, baseUrl);
        return url.href;
    } catch {
        return '';
    }
}

function getFallbackPreview(): LinkMetadata {
    return {
        title: 'Preview not available',
        description: '',
        imageUrl: '',
        siteName: '',
        favicon: '',
        type: 'website',
        lastFetched: Date.now()
    };
}

function extractYouTubeVideoId(url: string): string {
    const videoIdRegex = /(?:\/embed\/|\/watch\?v=|\/(?:embed\/|v\/|watch\?.*v=|youtu\.be\/|embed\/|v=))([^&?#]+)/;
    const match = url.match(videoIdRegex);
    return match ? match[1] : '';
}
