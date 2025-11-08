# Stagstation

A cross-platform desktop application for managing save files for **Hollow Knight** and **Hollow Knight: Silksong**. Convert saves between PC and Switch formats, edit your saves with a powerful visual editor, and sync with Google Drive—all in one beautiful, easy-to-use interface.

Available for **Windows**, **macOS**, and **Linux** (including SteamOS).

![Stagstation](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

### 🔄 Save Conversion
Seamlessly convert your save files between PC and Switch formats. Play on your PC, continue on your Switch, or vice versa—Stagstation handles all the technical complexity behind the scenes.

### ✏️ Save Editor
Edit your save files directly with a powerful visual editor or raw JSON editor:
- **Visual Editor**: Edit values with an intuitive interface (checkboxes for booleans, text fields for strings/numbers)
- **Raw JSON Editor**: Full VS Code-style syntax highlighting, validation, and IntelliSense
- **Smart Performance**: Large files automatically use collapsible sections for smooth editing
- **Automatic Backups**: Optionally create backups before editing saves

### ☁️ Cloud Sync
Keep your saves backed up and synchronized with Google Drive:
- Never lose your progress
- Access your saves from anywhere
- View sync status at a glance (Local Newer, Cloud Newer, In Sync)
- Upload or download saves with one click

### 🎯 Auto-Detection
Stagstation automatically finds your save files in configured paths—no more hunting through folders!

### 📁 Multi-Format Support
Works with both `.dat` and `.zip` files, and automatically includes `.nx_save_meta.bin` files for Switch saves to prevent JKSV errors.

---

## 🚀 Quick Start

### Installation

1. **Download** the latest release for your platform (Windows, macOS, or Linux)

2. **Install** the application (or extract if portable)

3. **Launch** Stagstation

### First-Time Setup

1. Open Stagstation and go to the **Settings** tab

2. **Configure your save file paths:**
   - **PC Save Path**: Set this to where your PC saves are located
     - Windows: `C:\Users\YourName\AppData\LocalLow\Team Cherry\Hollow Knight`
     - macOS: `~/Library/Application Support/unity.Team Cherry.Hollow Knight`
     - Linux: `~/.config/unity3d/Team Cherry/Hollow Knight`
   - **Switch JKSV Path**: Set this to where your Switch saves are located (from JKSV)
     - Example: `D:\JKSV\Hollow Knight` or `/media/sdcard/JKSV/Hollow Knight`

3. **Optional**: Configure your default page, editor backup settings, and cloud sync preferences

---

## 📖 How to Use

### Converting Save Files

1. Go to the **Converter** tab
2. Select your game (Hollow Knight or Silksong)
3. Choose conversion direction:
   - **PC → Switch**: Convert a PC save to Switch format
   - **Switch → PC**: Convert a Switch save to PC format
4. Stagstation will auto-detect available save files, or click **Browse** to select manually
5. Choose an output location (or use the suggested path)
6. Click **Convert Save File**

That's it! Your converted save is ready to use.

### Editing Save Files

1. Go to the **Editor** tab (default page)
2. Select your game (Hollow Knight or Silksong)
3. Choose a save file:
   - Stagstation will show detected save files with slot numbers and dates
   - Or click **Browse** to select manually
4. Choose your editing mode:
   - **Editor Tab**: Visual interface with checkboxes and text fields
   - **Raw JSON Tab**: Direct JSON editing with VS Code-style features
5. Make your changes
6. Click **Save Changes** to apply your edits

**Tip**: Enable automatic backups in Settings to create a backup copy before saving!

### Cloud Sync (Optional)

1. Go to the **Cloud Sync** tab
2. Select your game (Hollow Knight or Silksong)
3. Click **Connect to Google Drive** and follow the authentication flow
4. Once connected, you'll see:
   - Your local saves
   - Your cloud saves
   - Sync status indicators
5. Upload or download saves directly from the interface

**Note**: For Google Drive API setup, see the [JKSV Google Drive guide](https://switch.hacks.guide/homebrew/jksv.html?tab=google-drive#setting-up-remote-save-data-backups-google-drive-webdav). Stagstation uses OAuth2 device flow for authentication, which is handled automatically.

---

## 📍 Save File Locations

### PC Save Locations

**Hollow Knight:**
- **Windows**: `%USERPROFILE%\AppData\LocalLow\Team Cherry\Hollow Knight\`
- **macOS**: `~/Library/Application Support/unity.Team Cherry.Hollow Knight/`
- **Linux**: `~/.config/unity3d/Team Cherry/Hollow Knight/`
- Files: `user1.dat`, `user2.dat`, `user3.dat`, etc.

**Silksong:**
- **Windows**: `%USERPROFILE%\AppData\LocalLow\Team Cherry\Hollow Knight Silksong\`
- **macOS**: `~/Library/Application Support/unity.Team-Cherry.Silksong/`
- **Linux**: `~/.config/unity3d/Team Cherry/Hollow Knight Silksong/`
- Files: `user1.dat`, `user2.dat`, etc.

### Switch Save Locations (JKSV)

After backing up your save with JKSV, saves are typically located at:
- `[SD_Card]:\JKSV\Hollow Knight\` or `[SD_Card]:\JKSV\Hollow Knight Silksong\`
- Files: `user1.dat`, `user2.dat`, etc. (plain JSON format)
- Also supports `.zip` files containing save data

**Note**: When converting PC saves to Switch format, you can enable automatic inclusion of `.nx_save_meta.bin` files in Settings. This prevents the "Backup contains no meta file!" error in JKSV.

---

## ⚙️ Settings

Stagstation offers several customizable settings:

- **Default Page**: Choose which page to show when the app starts (Editor, Converter, or Cloud Sync)
- **Editor Auto-Backup**: Automatically create backups before saving edits
- **Backup Location**: Customize where backups are saved
- **Cloud Sync**: Configure Google Drive integration and backup preferences
- **Meta File Handling**: Configure automatic meta file inclusion for Switch saves

---

## 🛠️ Troubleshooting

### Conversion Fails
- ✅ Ensure the input file is valid (not corrupted)
- ✅ Check that you're selecting the correct game and direction
- ✅ Verify file permissions (read/write access)

### Auto-Detect Doesn't Work
- ✅ Make sure you've set the correct paths in Settings
- ✅ Verify the directories exist and contain `.dat` or `.zip` files
- ✅ Try using the Browse button instead

### Editor is Slow
- ✅ Large files automatically use collapsible sections—click to expand sections you need
- ✅ Use the Raw JSON tab for faster editing of large files
- ✅ The loading screen appears while rendering—this is normal for large files

### Cloud Sync Issues
- ✅ Ensure you're connected to Google Drive (check the status indicator)
- ✅ Verify you have internet connectivity
- ✅ If authentication fails, try disconnecting and reconnecting
- ✅ Check that you have the necessary permissions for the Google Drive folder

---

## 💻 For Developers

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dizzyfrogs/stagstation.git
   cd stagstation
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run electron:dev
   ```
   This starts the Vite dev server and launches Electron automatically.

### Building for Production

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Run with production build:**
   ```bash
   npm run electron
   ```

   Or build and run in one command:
   ```bash
   npm start
   ```

### Building for Distribution

Stagstation uses **electron-builder** to create distributable packages for all platforms.

#### Quick Build

Build for your current platform:
```bash
npm run dist
```

#### Platform-Specific Builds

**Windows:**
```bash
npm run dist:win
```
Creates:
- NSIS installer (`.exe`) for x64 and ia32
- Portable version (`.exe`) for x64

**macOS:**
```bash
npm run dist:mac
```
Creates:
- DMG installer for x64 and arm64 (Apple Silicon)
- ZIP archive for x64 and arm64

**Note:** Building macOS packages requires macOS. For cross-platform builds, use CI/CD.

**Linux:**
```bash
npm run dist:linux
```
Creates:
- AppImage (`.AppImage`) for x64
- Debian package (`.deb`) for x64

#### Build for All Platforms

```bash
npm run dist:all
```

**Note:** This will attempt to build for all platforms. macOS builds require macOS, but Windows and Linux can be built from any platform.

#### Output Location

All built packages are saved to the `dist-packages/` directory.

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

### Technical Details

**Encryption:**
- Algorithm: AES-128-ECB
- Key: `UKu52ePUBwetZ9wNX88o54dnfKRu0T1l` (32 bytes)
- Padding: PKCS7
- Encoding: Base64

**File Format:**
- **PC Format**: C# binary header (22 bytes) + Length-prefixed string + Base64-encoded encrypted data
- **Switch Format**: Plain JSON text file (decrypted)

---

## 📝 License

MIT License - See LICENSE file for details

---

## ⚠️ Disclaimer

This tool is for personal use only. **Always make backups of your save files before converting or editing.** The authors are not responsible for any data loss.

---

## 🙏 Credits

**Created By:**
- [dizzyfrogs](https://github.com/dizzyfrogs)

**Save File Conversion:**
- Conversion logic based on [bloodorca/hollow](https://github.com/bloodorca/hollow)

**UI & Sync Features:**
- Influenced by [ArixAR/hollow-sync](https://github.com/ArixAR/hollow-sync)

**Special Thanks:**
This tool was created for the **Hollow Knight community**. Special thanks to **Team Cherry** for creating these amazing games!

---

## 💬 Why I Built This

This project originally started as a tool to streamline transferring my save files between my Switch and PC. I quickly realized that tools for this already exist, but I decided to combine and streamline them anyway as a way to learn about using certain technologies.

This project has been a great learning experience, and now I have a tool that makes managing saves for these amazing games seamless and enjoyable.

**Built with passion for the Hollow Knight community.** ❤️
