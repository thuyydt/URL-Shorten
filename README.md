# URL Shortener Chrome Extension

A Chrome extension that allows you to quickly shorten URLs using is.gd or v.gd services directly from your browser.

## Features

- 🔗 Shorten URLs using is.gd or v.gd services
- 🎯 Auto-detect current tab URL
- ✏️ Custom alias support
- 📋 One-click copy to clipboard
- 🖱️ Right-click context menu integration
- 🎨 Modern, responsive UI design
- ⚡ Fast and lightweight

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your Chrome toolbar

### From Chrome Web Store

*Coming soon - extension will be published to Chrome Web Store*

## Usage

### Using the Popup

1. Click the extension icon in your Chrome toolbar
2. The current tab URL will be automatically loaded
3. Choose between is.gd or v.gd service
4. Optionally enter a custom alias
5. Click "Shorten URL"
6. Copy the shortened URL with one click

### Using Context Menu

1. Right-click on any link or page
2. Select "Shorten this URL" from the context menu
3. The extension popup will open with the URL pre-filled

## API Services

This extension uses two popular URL shortening services:

- **is.gd** - Fast, reliable URL shortening with custom alias support
- **v.gd** - Alternative service with identical features to is.gd

Both services are free and don't require API keys.

## Permissions

The extension requires the following permissions:

- `activeTab` - To access the current tab URL
- `contextMenus` - To add right-click context menu options
- `storage` - To temporarily store URLs for context menu functionality
- `host_permissions` - To make API calls to is.gd and v.gd

## Privacy

- No user data is collected or stored
- URLs are only sent to the selected shortening service (is.gd or v.gd)
- All processing happens locally in your browser

## Development

### Project Structure

```
├── manifest.json          # Extension manifest
├── popup.html             # Popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── background.js          # Background service worker
├── icons/                 # Extension icons
│   └── icon.svg          # SVG icon (convert to PNG)
└── README.md              # This file
```

### Building

This is a pure JavaScript Chrome extension with no build process required. Simply load the folder in Chrome's developer mode.

### Converting Icons

Convert the SVG icon to PNG format in multiple sizes:
- 16x16px (icon16.png)
- 32x32px (icon32.png) 
- 48x48px (icon48.png)
- 128x128px (icon128.png)

### Testing

1. Load the extension in developer mode
2. Test the popup interface
3. Test context menu functionality
4. Test URL validation and error handling
5. Test both is.gd and v.gd services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues:

1. Check that the extension has the required permissions
2. Verify that is.gd and v.gd services are accessible
3. Check the browser console for error messages
4. Reload the extension in chrome://extensions/

## Version History

- **1.0.0** - Initial release
  - Basic URL shortening with is.gd and v.gd
  - Popup interface with service selection
  - Context menu integration
  - Custom alias support
  - Modern responsive design
