# Your Personal Knowledge Hub

A desktop app I built to manage my notes and knowledge. It's built with Electron and includes some cool features like AI embeddings and a Chrome extension for quick capture of web content.

## Key Features

- **Grab Stuff from the Web**: 
  - Chrome extension to quickly save content while browsing
- **Smart Organization**: 
  - Tag-based organization system
  - Collections for grouping related notes
  - Threaded conversations for complex topics
  - AI-powered embeddings for content similarity search
- **Rich Content Support**:
  - Markdown editor with real-time preview
  - Image attachments
  - Link previews with metadata
  - Code snippets
  - Quote blocks
  - quick capture of web content
- **Local-First Architecture**:
  - All notes stored locally in markdown format
  - Configurable notes directory
  - No cloud dependency
  - Fast and reliable access

## Technical Stack

Built with:
- Electron + React
- TypeScript
- React Context for state
- Custom Markdown editor (TipTap)
- OpenAI API for the smart stuff
- Local file storage
- Webpack & Electron Forge

## Getting Started

1. Grab the code aka clone the repo
2. Install the goods aka dependencies:
```bash
npm install
```

3. Set up the Chrome extension:
- Run current project
- Navigate to chrome://extensions/
- Enable "Developer mode"
- Click "Load unpacked" and select the chromeExtension directory

4. Start the development server:
```bash
npm start
```

## Configuration

On first launch, you'll need to configure:
- Notes storage location
- OpenAI API key (for AI features)

## Security

- Local-first architecture ensures data privacy
- Secure file protocol implementation
- Safe external link handling
- Content Security Policy enforcement

## License

MIT License - feel free to use and modify as needed.

---

## Development Notes

### Boilerplate
Based on https://rdarida.medium.com/electron-react-the-boilerplate-fc3a7d9b9ec1

Modifications:
- Didn't install UI libraries
- Added name: '' to forge.config.ts to create a second entry point for routing via react-router-dom
- Added App.tsx and Application.tsx to handle routing

### Chrome Extension
To use the chrome extension:
1. Run current project
2. Go to chrome://extensions/
3. Enable "Developer mode"
4. Click "Load unpacked" and select the chromeExtension directory "chromeExtension"

All actions like get URL, get selection, get page info are handled by the extension.


