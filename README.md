# Stagstation

A desktop application for managing save files for **Hollow Knight** and **Hollow Knight: Silksong**. Convert saves between PC and Switch formats, sync with Google Drive, and more.

## Features

- **Save Conversion**: Bidirectional conversion between PC and Switch formats
- **Save Editor**: Edit save files with a powerful visual editor or raw JSON editor with VS Code-style syntax highlighting
- **Cloud Sync**: Backup and sync your saves with Google Drive
- **Auto-Detection**: Automatically find save files in configured paths
- **Meta File Support**: Automatically include `.nx_save_meta.bin` files for Switch saves
- **Multi-Format Support**: Works with both `.dat` and `.zip` files
- **Automatic Backups**: Optionally create backups before editing saves
- **Modern UI**: Built with React and Mantine UI - clean, intuitive interface with smooth animations

## Why I Built This

This project originally started as a tool to streamline transferring my save files between my Switch and PC. I quickly realized that tools for this already exist, but I decided to combine and streamline them anyway as a way to learn about using certain technologies.

This project has been a great learning experience, and now I have a tool that makes managing saves for these amazing games seamless and enjoyable.

Built with passion for the **Hollow Knight community**.

## How It Works

**PC saves** are encrypted using AES-ECB encryption with Base64 encoding and wrapped in a C# binary header. **Switch saves** (via homebrew/JKSV) are plain JSON text files.

This tool handles:
- Removing/adding C# binary headers
- Base64 encoding/decoding
- AES-ECB encryption/decryption
- PKCS7 padding/unpadding

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

## Installation

1. **Clone or download this repository**

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

## Usage

### Running in Development Mode

1. **Start the development server:**
   ```bash
   npm run electron:dev
   ```
   This will start the Vite dev server and launch Electron automatically.

### Running in Production Mode

1. **Build and start the application:**
   ```bash
   npm start
   ```
   This builds the React app and launches Electron with the production build.

2. **Configure Settings:**
   - Go to the Settings tab
   - Set your PC save path (e.g., `C:\Users\YourName\AppData\LocalLow\Team Cherry\Hollow Knight`)
   - Set your Switch JKSV path (e.g., `D:\JKSV\Hollow Knight Silksong`)

3. **Convert a Save File:**
   - Select the game (Hollow Knight or Silksong)
   - Choose conversion direction (PC → Switch or Switch → PC)
   - Stagstation will auto detect save files, or you can use "Browse" to select manually
   - Choose output location (or use the suggested path)
   - Click "Convert Save File"

4. **Edit a Save File:**
   - Go to the Editor tab
   - Select the game (Hollow Knight or Silksong)
   - Choose a save file (auto-detected or browse manually)
   - Use the **Editor** tab to edit values with a visual interface (checkboxes for booleans, text fields for strings/numbers)
   - Or use the **Raw JSON** tab to edit directly with full VS Code-style syntax highlighting and validation
   - Large files automatically use collapsible sections for better performance
   - Click "Save Changes" to apply your edits
   - Optionally enable automatic backups in Settings

5. **Cloud Sync (Optional):**
   - Go to the Cloud Sync tab
   - Select your game (Hollow Knight or Silksong)
   - Click "Connect to Google Drive" and follow the authentication flow
   - View your cloud saves with status indicators (Local Newer, Cloud Newer, In Sync)
   - Upload or download saves directly from the interface
   
   **Note:** For information on setting up Google Drive API credentials, see the [JKSV Google Drive setup guide](https://switch.hacks.guide/homebrew/jksv.html?tab=google-drive#setting-up-remote-save-data-backups-google-drive-webdav). Stagstation uses OAuth2 device flow for authentication, which is handled automatically during the connection process.

## Save File Locations

### PC Save Locations

**Hollow Knight:**
- **Windows:** `%USERPROFILE%\AppData\LocalLow\Team Cherry\Hollow Knight\`
- **macOS:** `~/Library/Application Support/unity.Team Cherry.Hollow Knight/`
- **Linux:** `~/.config/unity3d/Team Cherry/Hollow Knight/`
- Files: `user1.dat`, `user2.dat`, `user3.dat`, etc.

**Silksong:**
- **Windows:** `%USERPROFILE%\AppData\LocalLow\Team Cherry\Hollow Knight Silksong\`
- **macOS:** `~/Library/Application Support/unity.Team-Cherry.Silksong/`
- **Linux:** `~/.config/unity3d/Team Cherry/Hollow Knight Silksong/`
- Files: `user1.dat`, `user2.dat`, etc.

### Switch Save Locations (JKSV)

After backing up your save with JKSV, the saves are typically located at:
- `[SD_Card]:\JKSV\Hollow Knight\` or `[SD_Card]:\JKSV\Hollow Knight Silksong\`
- Files: `user1.dat`, `user2.dat`, etc. (plain JSON format)
- Also supports `.zip` files containing save data

**Note:** When converting PC saves to Switch format, you can enable automatic inclusion of `.nx_save_meta.bin` files in the Settings. This prevents the "Backup contains no meta file!" error in JKSV. The tool can automatically pull the meta file from your most recent cloud save, or you can specify a custom path.

## Technical Details

### Encryption

- **Algorithm:** AES-128-ECB
- **Key:** `UKu52ePUBwetZ9wNX88o54dnfKRu0T1l` (32 bytes)
- **Padding:** PKCS7
- **Encoding:** Base64

### File Format

**PC Format:**
1. C# binary header (22 bytes)
2. Length-prefixed string ("System.Byte[]")
3. Base64-encoded encrypted data

**Switch Format:**
- Plain JSON text file (decrypted)

## Troubleshooting

### Conversion Fails
- Ensure the input file is valid (not corrupted)
- Check that you're selecting the correct game and direction
- Verify file permissions (read/write access)

### Auto-Detect Doesn't Work
- Make sure you've set the correct paths in Settings
- Verify the directories exist and contain `.dat` or `.zip` files
- Try using the Browse button instead

### Cloud Sync Issues
- Ensure you're connected to Google Drive (check the status indicator)
- Verify you have internet connectivity
- If authentication fails, try disconnecting and reconnecting
- Check that you have the necessary permissions for the Google Drive folder

## Development

### Tech Stack

- **Frontend**: React 18 with Vite
- **UI Framework**: Mantine UI
- **Icons**: Tabler Icons
- **Code Editor**: Monaco Editor (VS Code editor)
- **Backend**: Electron (Node.js)
- **Build Tool**: Vite

### Project Structure

```
stagstation/
├── main.js              # Electron main process
├── preload.js           # Preload script (IPC bridge)
├── converter.js         # Save file conversion logic
├── cloud-sync.js        # Google Drive integration
├── index.html           # HTML entry point
├── vite.config.js       # Vite configuration
├── package.json         # Node.js dependencies
├── assets/              # Images and fonts
├── src/                 # React source code
│   ├── main.jsx         # React entry point
│   ├── App.jsx          # Main app component
│   ├── index.css         # Global styles
│   ├── components/      # React components
│   │   ├── SideNavbar.jsx
│   │   ├── MainContent.jsx
│   │   ├── GameSwitcher.jsx
│   │   ├── DustCanvas.jsx
│   │   └── Modal.jsx
│   ├── tabs/            # Page components
│   │   ├── ConverterTab.jsx
│   │   ├── EditorTab.jsx
│   │   ├── CloudSyncTab.jsx
│   │   ├── AboutTab.jsx
│   │   ├── CreditsTab.jsx
│   │   └── SettingsTab.jsx
│   └── hooks/           # Custom React hooks
│       └── useModal.js
└── LICENSE              # MIT License
```

### Development Commands

- `npm run dev` - Start Vite dev server only
- `npm run electron:dev` - Start dev server + Electron (recommended for development)
- `npm run build` - Build for production
- `npm run electron` - Run Electron with production build
- `npm start` - Build and run Electron

### Building for Distribution

To create a distributable package, you can use tools like:
- [electron-builder](https://www.electron.build/)
- [electron-packager](https://github.com/electron/electron-packager)

First, build the React app:
```bash
npm run build
```

Then use your preferred Electron packaging tool to create installers for Windows, macOS, and Linux.

## License

MIT License - See LICENSE file for details

## Disclaimer

This tool is for personal use only. Make backups of your save files before converting. The authors are not responsible for any data loss.

## Credits

**Created By:**
- [dizzyfrogs](https://github.com/dizzyfrogs)

**Save File Conversion:**
- Conversion logic based on [bloodorca/hollow](https://github.com/bloodorca/hollow)

**UI & Sync Features:**
- Influenced by [ArixAR/hollow-sync](https://github.com/ArixAR/hollow-sync)

**Special Thanks:**
- This tool was created for the Hollow Knight community. Special thanks to Team Cherry for creating these amazing games!
