#### boilerplate
---
https://rdarida.medium.com/electron-react-the-boilerplate-fc3a7d9b9ec1

with some modifications:
- didn't install UI libraries
- added name: '', to forge.config.ts to create a second entry point for routing via react-router-dom
- added App.tsx and Application.tsx to handle routing


### chrome extension for capturing page info
---

To use the chrome extension:
1. run current project
2. go to chrome://extensions/
3. enable "Developer mode"
4. click "Load unpacked" and select the chromeExtension directory "chromeExtension"

that is all actions like get url, get selection, get page info are handled by the extension


