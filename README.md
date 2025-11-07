# Stagstation

A desktop application for converting save files between PC and Switch formats for **Hollow Knight** and **Hollow Knight: Silksong**.

## Features

- Support for both Hollow Knight and Silksong
- Bidirectional conversion: PC ↔ Switch
- Auto-detection of save files
- File picker for manual selection
- Configurable save paths
- Modern, intuitive UI

## Why I Made This

I've been really getting into Hollow Knight and Silksong on Steam, but I wanted to play them on my TV using my homebrewed Switch. The existing workflow was tedious - using a converter tool, ejecting my SD card, navigating through JKSV, copying files around... it was a hassle every time I wanted to sync my progress.

I noticed there were already some similar tools out there, but I was excited about the idea of learning how to build a desktop app. So I decided to make my own all-in-one tool that streamlines the whole process. This project was a great learning experience in Electron, and now I have a tool that makes switching between PC and Switch saves way less annoying.

## How It Works

**PC saves** are encrypted using AES-ECB encryption with Base64 encoding and wrapped in a C# binary header. **Switch saves** (via homebrew/JKSV) are plain JSON text files.

This tool handles:
- Removing/adding C# binary headers
- Base64 encoding/decoding
- AES-ECB encryption/decryption
- PKCS7 padding/unpadding

## Prerequisites

- **Node.js** (v16 or higher)

## Installation

1. **Clone or download this repository**

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

## Usage

1. **Start the application:**
   ```bash
   npm start
   ```

2. **Configure Settings:**
   - Go to the Settings tab
   - Set your PC save path (e.g., `C:\Users\YourName\AppData\LocalLow\Team Cherry\Hollow Knight`)
   - Set your Switch JKSV path (e.g., `D:\JKSV\Hollow Knight Silksong`)

3. **Convert a Save File:**
   - Select the game (Hollow Knight or Silksong)
   - Choose conversion direction (PC → Switch or Switch → PC)
   - Click "Auto Detect" to find save files, or use "Browse" to select manually
   - Choose output location (or use the suggested path)
   - Click "Convert Save File"

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
- Verify the directories exist and contain `.dat` files
- Try using the Browse button instead

## Development

### Project Structure

```
stagstation/
├── main.js           # Electron main process
├── preload.js        # Preload script (IPC bridge)
├── converter.js      # Save file conversion logic
├── index.html        # UI markup
├── styles.css        # UI styles
├── renderer.js       # UI logic and particle system
├── package.json      # Node.js dependencies
├── assets/           # Images and fonts
└── LICENSE           # MIT License
```

### Building for Distribution

To create a distributable package, you can use tools like:
- [electron-builder](https://www.electron.build/)
- [electron-packager](https://github.com/electron/electron-packager)

## License

MIT License - See LICENSE file for details

## Disclaimer

This tool is for personal use only. Make backups of your save files before converting. The authors are not responsible for any data loss.

## Credits

**Save File Conversion Logic:**
- The encryption/decryption and save file conversion logic for Switch compatibility is based on the work from [bloodorca/hollow](https://github.com/bloodorca/hollow). This online save file editor provided the foundation for understanding how to handle the C# binary headers, AES encryption, and format conversion.

**UI Inspiration & Features:**
- UI design and several features were inspired by [ArixAR/hollow-sync](https://github.com/ArixAR/hollow-sync). Their desktop application approach and workflow improvements influenced the design of this tool.

**Special Thanks:**
- This tool was created for the Hollow Knight community. Special thanks to Team Cherry for creating these amazing games!
