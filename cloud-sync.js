const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const { pcToSwitch, switchToPc } = require('./converter.js');
const os = require('os');
const AdmZip = require('adm-zip');

class CloudSyncService {
  constructor(settings) {
    this.settings = settings || {};
    this.auth = null;
    this.drive = null;
    this.authenticated = false;
    this.jksvFolderId = null;
    this.pendingOAuthClient = null;
    this.deviceCode = null;
    this.deviceCodeInterval = null;
    this.deviceCodeExpiresIn = 1800;
  }

  async authenticate(credentialsPath) {
    try {
      if (!credentialsPath || !await this.fileExists(credentialsPath)) {
        throw new Error('Credentials file not found. Please set up Google Drive credentials.');
      }

      const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
      
      // device flow oauth
      const oauth2Client = new google.auth.OAuth2(
        credentials.installed.client_id,
        credentials.installed.client_secret,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      // check for stored tokens
      const tokenPath = path.join(os.homedir(), '.stagstation', 'google-tokens.json');
      let tokens = null;
      
      try {
        if (await this.fileExists(tokenPath)) {
          tokens = JSON.parse(await fs.readFile(tokenPath, 'utf-8'));
          oauth2Client.setCredentials(tokens);
        }
      } catch (error) {
        // no tokens, need auth
      }

      if (!tokens) {
        // device flow auth
        const deviceCodeResponse = await this.requestDeviceCode(
          credentials.installed.client_id,
          credentials.installed.client_secret
        );

        // store oauth client and device code
        this.pendingOAuthClient = oauth2Client;
        this.deviceCode = deviceCodeResponse.device_code;
        this.deviceCodeExpiresIn = deviceCodeResponse.expires_in || 1800;
        this.deviceCodeInterval = deviceCodeResponse.interval || 5;

        // return device code for user
        return { 
          success: false, 
          needsAuth: true, 
          userCode: deviceCodeResponse.user_code,
          verificationUrl: deviceCodeResponse.verification_url || 'https://google.com/device',
          interval: deviceCodeResponse.interval || 5,
          expiresIn: deviceCodeResponse.expires_in || 1800
        };
      }

      this.auth = oauth2Client;
      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
      this.authenticated = true;

      // find/create JKSV folder
      await this.findJKSVFolder();

      return { success: true, authenticated: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async requestDeviceCode(clientId, clientSecret) {
    const https = require('https');
    const querystring = require('querystring');

    const postData = querystring.stringify({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file'
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'oauth2.googleapis.com',
        path: '/device/code',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': postData.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.error) {
              reject(new Error(response.error_description || response.error));
            } else {
              resolve(response);
            }
          } catch (error) {
            reject(new Error(`Failed to parse device code response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  async pollForToken(clientId, clientSecret, deviceCode, interval = 5, expiresIn = 1800) {
    const https = require('https');
    const querystring = require('querystring');

    const startTime = Date.now();
    const timeout = expiresIn * 1000; // convert to milliseconds

    return new Promise((resolve, reject) => {
      const poll = async () => {
        // check if we've exceeded the expiration time
        if (Date.now() - startTime > timeout) {
          reject(new Error('Device code expired. Please try connecting again.'));
          return;
        }
        const postData = querystring.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        });

        const options = {
          hostname: 'oauth2.googleapis.com',
          path: '/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              if (response.error) {
                if (response.error === 'authorization_pending') {
                  // still waiting for user authorization, poll again
                  setTimeout(poll, interval * 1000);
                } else if (response.error === 'slow_down') {
                  // rate limited, wait longer
                  setTimeout(poll, (interval + 5) * 1000);
                } else {
                  reject(new Error(response.error_description || response.error));
                }
              } else {
                // got the token
                resolve(response);
              }
            } catch (error) {
              reject(new Error(`Failed to parse token response: ${error.message}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.write(postData);
        req.end();
      };

      // start polling
      poll();
    });
  }

  async completeAuth(credentialsPath) {
    try {
      if (!this.pendingOAuthClient || !this.deviceCode) {
        throw new Error('No pending OAuth client or device code. Please call authenticate first.');
      }

      const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
      
      // poll for token
      const tokenResponse = await this.pollForToken(
        credentials.installed.client_id,
        credentials.installed.client_secret,
        this.deviceCode,
        this.deviceCodeInterval,
        this.deviceCodeExpiresIn
      );

      // set credentials on OAuth client
      this.pendingOAuthClient.setCredentials({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expiry_date: Date.now() + (tokenResponse.expires_in * 1000)
      });

      // save tokens
      const tokenPath = path.join(os.homedir(), '.stagstation');
      await fs.mkdir(tokenPath, { recursive: true });
      await fs.writeFile(
        path.join(tokenPath, 'google-tokens.json'),
        JSON.stringify({
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expiry_date: Date.now() + (tokenResponse.expires_in * 1000)
        }, null, 2)
      );

      this.auth = this.pendingOAuthClient;
      this.drive = google.drive({ version: 'v3', auth: this.pendingOAuthClient });
      this.authenticated = true;
      this.pendingOAuthClient = null; // clear pending client
      this.deviceCode = null; // clear device code

      await this.findJKSVFolder();

      return { success: true, authenticated: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async findJKSVFolder() {
    try {
      // search for JKSV folder
      const response = await this.drive.files.list({
        q: "name='JKSV' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (response.data.files.length > 0) {
        this.jksvFolderId = response.data.files[0].id;
        return this.jksvFolderId;
      }

      // create JKSV folder if it doesn't exist
      const folderMetadata = {
        name: 'JKSV',
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      this.jksvFolderId = folder.data.id;
      return this.jksvFolderId;
    } catch (error) {
      throw new Error(`Failed to find/create JKSV folder: ${error.message}`);
    }
  }

  // NOTE: This method is currently unused. JKSV saves are stored directly in game folders,
  // not in user-specific subfolders. This method was originally intended for user folder support
  // but is not needed with the current implementation.
  async findUserFolder(userName) {
    if (!this.jksvFolderId) {
      await this.findJKSVFolder();
    }

    try {
      const response = await this.drive.files.list({
        q: `'${this.jksvFolderId}' in parents and name='${userName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)'
      });

      if (response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // create user folder
      const folderMetadata = {
        name: userName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [this.jksvFolderId]
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    } catch (error) {
      throw new Error(`Failed to find/create user folder: ${error.message}`);
    }
  }

  async findGameFolder(gameName) {
    if (!this.jksvFolderId) {
      await this.findJKSVFolder();
    }

    try {
      // look directly in JKSV folder, skip user folder
      const response = await this.drive.files.list({
        q: `'${this.jksvFolderId}' in parents and name='${gameName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)'
      });

      if (response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // create game folder directly in JKSV
      const folderMetadata = {
        name: gameName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [this.jksvFolderId]
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    } catch (error) {
      throw new Error(`Failed to find/create game folder: ${error.message}`);
    }
  }

  async listSaves(game) {
    if (!this.authenticated) {
      throw new Error('Not authenticated with Google Drive');
    }

    const gameName = game === 'hollowknight' ? 'Hollow Knight' : 'Hollow Knight Silksong';
    const gameFolderId = await this.findGameFolder(gameName);

    try {
      // JKSV stores saves as .zip files directly in the game folder
      const response = await this.drive.files.list({
        q: `'${gameFolderId}' in parents and name contains '.zip' and trashed=false`,
        fields: 'files(id, name, modifiedTime)',
        orderBy: 'modifiedTime desc'
      });

      const saves = [];
      for (const zipFile of response.data.files) {
        // download and inspect zip to get slot information
        try {
          const tempZipPath = path.join(os.tmpdir(), `stagstation_${Date.now()}_${zipFile.name}`);
          await this.downloadSaveFile(zipFile.id, tempZipPath);
          
          const zip = new AdmZip(tempZipPath);
          const zipEntries = zip.getEntries();
          
          const saveFiles = zipEntries
            .filter(entry => entry.entryName.match(/^user\d+\.dat$/i) && !entry.isDirectory)
            .map(entry => {
              const match = entry.entryName.match(/^user(\d+)\.dat$/i);
              return {
                id: zipFile.id, // Use zip file ID
                name: entry.entryName,
                modifiedTime: zipFile.modifiedTime,
                slotNumber: parseInt(match ? match[1] : '0'),
                entryName: entry.entryName
              };
            });

          // clean up temp file
          await fs.unlink(tempZipPath).catch(() => {});

          if (saveFiles.length > 0) {
            // remove .zip extension from name for display
            const displayName = zipFile.name.replace(/\.zip$/i, '');
            saves.push({
              id: zipFile.id,
              name: displayName,
              modifiedTime: zipFile.modifiedTime,
              files: saveFiles,
              zipFileName: zipFile.name
            });
          }
        } catch (error) {
          console.error(`Error processing zip ${zipFile.name}:`, error);
          // continue with other files
        }
      }

      return saves;
    } catch (error) {
      throw new Error(`Failed to list saves: ${error.message}`);
    }
  }

  async downloadSaveFile(fileId, outputPath) {
    try {
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      const writeStream = require('fs').createWriteStream(outputPath);
      response.data.pipe(writeStream);

      return new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  async uploadFile(filePath, fileName, parentFolderId) {
    try {
      const fileMetadata = {
        name: fileName,
        parents: [parentFolderId]
      };

      const media = {
        mimeType: 'application/octet-stream',
        body: require('fs').createReadStream(filePath)
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, modifiedTime'
      });

      return file.data;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async compareSlot(game, slotNumber, localPath) {
    try {
      if (!await this.fileExists(localPath)) {
        return {
          status: 'cloud-only',
          localTime: null,
          cloudTime: null,
          action: null
        };
      }

      const localStats = await fs.stat(localPath);
      const localTime = localStats.mtime;

      // find cloud version (no userName needed)
      const saves = await this.listSaves(game);
      let cloudTime = null;
      let cloudFile = null;

      for (const save of saves) {
        const slotFile = save.files.find(f => f.slotNumber === slotNumber);
        if (slotFile) {
          cloudTime = new Date(slotFile.modifiedTime);
          cloudFile = {
            ...slotFile,
            saveId: save.id,
            zipFileName: save.zipFileName || save.name + '.zip'
          };
          break;
        }
      }

      if (!cloudTime) {
        return {
          status: 'local-only',
          localTime: localTime,
          cloudTime: null,
          action: 'upload'
        };
      }

      const timeDiff = localTime.getTime() - cloudTime.getTime();
      const threshold = 1000; // 1 second threshold

      if (Math.abs(timeDiff) < threshold) {
        return {
          status: 'in-sync',
          localTime: localTime,
          cloudTime: cloudTime,
          action: null,
          cloudFile: cloudFile
        };
      } else if (timeDiff > 0) {
        return {
          status: 'local-newer',
          localTime: localTime,
          cloudTime: cloudTime,
          action: 'upload',
          cloudFile: cloudFile
        };
      } else {
        return {
          status: 'cloud-newer',
          localTime: localTime,
          cloudTime: cloudTime,
          action: 'download',
          cloudFile: cloudFile
        };
      }
    } catch (error) {
      throw new Error(`Failed to compare slot: ${error.message}`);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async updateLocalFileTimestamp(localPath, cloudModifiedTime) {
    try {
      const cloudTime = new Date(cloudModifiedTime);
      await fs.utimes(localPath, cloudTime, cloudTime);
    } catch (error) {
      // non-fatal - log but don't throw
      console.warn(`Failed to update local file timestamp: ${error.message}`);
    }
  }

  async createBackup(filePath, backupDir) {
    await fs.mkdir(backupDir, { recursive: true });
    
    // generate timestamp
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    
    const fileName = path.basename(filePath);
    const backupPath = path.join(backupDir, `${fileName}_${timestamp}`);
    await fs.copyFile(filePath, backupPath);
    return backupPath;
  }
}

module.exports = { CloudSyncService };

