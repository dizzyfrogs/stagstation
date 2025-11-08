let state = {
    selectedGame: null,
    selectedDirection: null,
    inputFilePath: null,
    outputFilePath: null,
    cloudSyncGame: 'hollowknight',
    cloudConnected: false,
    settings: {
        pcSavePath: '',
        switchJKSVPath: '',
        cloudSync: {
            enabled: false,
            provider: 'google',
            createBackups: true,
            googleDrive: {
                credentialsPath: '',
                folderId: '',
                userName: ''
            }
        }
    },
    originalSettings: null // Store original settings for comparison
};

document.addEventListener('DOMContentLoaded', async () => {
    initializeWindowControls();
    initializeTabs();
    initializeGameSelection();
    initializeDirectionSelection();
    initializeFileSelection();
    initializeSettings();
    initializeCloudSync();
    initializeExternalLinks();
    await loadSettings();
    
    initializeParticleSystem();
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    document.getElementById('conversion-section').style.display = 'block';
});

function initializeExternalLinks() {
    // Handle all external links in credits section - open in default browser
    const creditsContainer = document.getElementById('credits-tab');
    if (creditsContainer) {
        creditsContainer.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && (link.href.startsWith('http://') || link.href.startsWith('https://'))) {
                e.preventDefault();
                window.electronAPI.openExternalUrl(link.href);
            }
        });
    }
}

function initializeWindowControls() {
    const minimizeBtn = document.getElementById('minimize-btn');
    const closeBtn = document.getElementById('close-btn');

    minimizeBtn.addEventListener('click', () => {
        window.electronAPI.windowMinimize();
    });

    closeBtn.addEventListener('click', () => {
        window.electronAPI.windowClose();
    });
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const tabInfo = {
        converter: {
            title: 'Converter',
            subtitle: 'Convert save files between PC and Switch'
        },
        'cloud-sync': {
            title: 'Cloud Sync',
            subtitle: 'Sync save files with Google Drive'
        },
        about: {
            title: 'About',
            subtitle: 'Learn about Stagstation'
        },
        credits: {
            title: 'Credits',
            subtitle: 'Acknowledgments and thanks'
        },
        settings: {
            title: 'Settings',
            subtitle: 'Configure save file paths and preferences'
        }
    };

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${targetTab}-tab`).classList.add('active');
            
            if (tabInfo[targetTab]) {
                pageTitle.textContent = tabInfo[targetTab].title;
                pageSubtitle.textContent = tabInfo[targetTab].subtitle;
            }
        });
    });
}

function initializeGameSelection() {
    const hollowknightToggle = document.getElementById('hollowknight-toggle');
    const silksongToggle = document.getElementById('silksong-toggle');
    const toggleSlider = document.getElementById('game-toggle-slider');
    
    state.selectedGame = 'hollowknight';
    updateToggleSlider('hollowknight');
    
    hollowknightToggle.addEventListener('click', () => {
        if (state.selectedGame !== 'hollowknight') {
            selectGame('hollowknight');
        }
    });
    
    silksongToggle.addEventListener('click', () => {
        if (state.selectedGame !== 'silksong') {
            selectGame('silksong');
        }
    });
}

function selectGame(game) {
    state.selectedGame = game;
    state.selectedDirection = null;
    state.inputFilePath = null;
    state.outputFilePath = null;
    
    updateToggleSlider(game);
    
    document.getElementById('conversion-section').style.display = 'block';
    document.getElementById('file-selection').style.display = 'none';
    document.getElementById('output-section').style.display = 'none';
    document.getElementById('convert-section').style.display = 'none';
    
    document.querySelectorAll('.direction-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

function updateToggleSlider(game) {
    const toggleSlider = document.getElementById('game-toggle-slider');
    const hollowknightToggle = document.getElementById('hollowknight-toggle');
    const silksongToggle = document.getElementById('silksong-toggle');
    
    if (game === 'hollowknight') {
        toggleSlider.style.transform = 'translateX(0)';
        hollowknightToggle.classList.add('active');
        silksongToggle.classList.remove('active');
    } else {
        toggleSlider.style.transform = 'translateX(100%)';
        hollowknightToggle.classList.remove('active');
        silksongToggle.classList.add('active');
    }
}

function initializeDirectionSelection() {
    const directionButtons = document.querySelectorAll('.direction-btn');
    
    directionButtons.forEach(button => {
        button.addEventListener('click', async () => {
            if (!state.selectedGame) return;
            
            directionButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            
            state.selectedDirection = button.dataset.direction;
            state.inputFilePath = null;
            state.outputFilePath = null;
            
            document.getElementById('file-selection').style.display = 'block';
            document.getElementById('output-section').style.display = 'none';
            document.getElementById('convert-section').style.display = 'none';
            document.getElementById('input-file-path').value = '';
            document.getElementById('output-file-path').value = '';
            document.getElementById('detected-files').innerHTML = '';
            
            await autoDetectSaveFiles();
        });
    });
}

function initializeFileSelection() {
    const browseInputBtn = document.getElementById('browse-input-btn');
    const browseOutputBtn = document.getElementById('browse-output-btn');
    const convertBtn = document.getElementById('convert-btn');
    
    browseInputBtn.addEventListener('click', async () => {
        const filePath = await window.electronAPI.selectFile();
        if (filePath) {
            state.inputFilePath = filePath;
            document.getElementById('input-file-path').value = filePath;
            suggestOutputPath();
        }
    });
    
    browseOutputBtn.addEventListener('click', async () => {
        const defaultPath = state.outputFilePath || suggestOutputPath();
        const filePath = await window.electronAPI.saveFile(defaultPath);
        if (filePath) {
            state.outputFilePath = filePath;
            document.getElementById('output-file-path').value = filePath;
            showConvertSection();
        }
    });
    
    convertBtn.addEventListener('click', async () => {
        await performConversion();
    });
}

async function autoDetectSaveFiles() {
    if (!state.selectedGame || !state.selectedDirection) return;
    
    const platform = state.selectedDirection === 'pc-to-switch' ? 'pc' : 'switch';
    let basePath = platform === 'pc' ? state.settings.pcSavePath : state.settings.switchJKSVPath;
    
    if (!basePath || basePath === '') {
        basePath = '';
    }
    
    try {
        const result = await window.electronAPI.detectSaveFiles({
            game: state.selectedGame,
            platform: platform,
            basePath: basePath
        });
        
        if (result.success && result.files.length > 0) {
            const detectedPath = result.path || basePath;
            displayDetectedFiles(result.files, detectedPath);
            showStatus('success', `Found ${result.files.length} save file(s)`);
        } else {
            showStatus('error', 'No save files detected. Please check the path in Settings or browse manually.');
        }
    } catch (error) {
        showStatus('error', `Error detecting files: ${error.message}`);
    }
}

function displayDetectedFiles(files, basePath) {
    const container = document.getElementById('detected-files');
    container.innerHTML = '';
    
    const filesArray = Array.isArray(files) && files.length > 0 && typeof files[0] === 'object' 
        ? files 
        : files.map(file => ({ filename: file, slotNumber: null, modifiedDate: null, path: null }));
    
    filesArray.forEach(fileInfo => {
        const file = typeof fileInfo === 'string' ? fileInfo : fileInfo.filename;
        const slotNumber = fileInfo.slotNumber;
        const modifiedDate = fileInfo.modifiedDate;
        const filePath = fileInfo.path;
        
        const slotCard = document.createElement('div');
        slotCard.className = 'slot-card';
        
        let fullPath;
        if (filePath) {
            fullPath = filePath;
        } else {
            const separator = basePath.includes('\\') ? '\\' : '/';
            fullPath = `${basePath}${separator}${file}`;
        }
        
        let dateText = 'Unknown';
        if (modifiedDate) {
            const date = new Date(modifiedDate);
            dateText = date.toLocaleDateString('en-US', { 
                month: 'numeric', 
                day: 'numeric', 
                year: 'numeric' 
            });
        }
        
        const slotNum = slotNumber !== null && slotNumber !== undefined 
            ? slotNumber 
            : (file.match(/^user(\d+)\.dat$/i) ? parseInt(file.match(/^user(\d+)\.dat$/i)[1]) : null);
        
        slotCard.innerHTML = `
            <div class="slot-header">
                <i data-lucide="hard-drive" class="slot-icon"></i>
                <span class="slot-title">SLOT ${slotNum || '?'}</span>
            </div>
            <div class="slot-date">
                <i data-lucide="clock" class="slot-icon-small"></i>
                <span>${dateText}</span>
            </div>
            <div class="slot-filename">${file}</div>
        `;
        
        slotCard.addEventListener('click', () => {
            state.inputFilePath = fullPath;
            document.getElementById('input-file-path').value = fullPath;
            suggestOutputPath();
            
            document.querySelectorAll('.slot-card').forEach(card => {
                card.classList.remove('selected');
            });
            slotCard.classList.add('selected');
        });
        
        container.appendChild(slotCard);
    });
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}


function suggestOutputPath() {
    if (!state.inputFilePath || !state.selectedDirection) return;
    
    const inputPath = state.inputFilePath;
    const lastSlash = Math.max(inputPath.lastIndexOf('\\'), inputPath.lastIndexOf('/'));
    const inputDir = lastSlash >= 0 ? inputPath.substring(0, lastSlash) : '';
    const inputFullName = lastSlash >= 0 ? inputPath.substring(lastSlash + 1) : inputPath;
    const lastDot = inputFullName.lastIndexOf('.');
    const inputName = lastDot >= 0 ? inputFullName.substring(0, lastDot) : inputFullName;
    
    let outputDir;
    let outputName;
    
    if (state.selectedDirection === 'pc-to-switch') {
        outputDir = state.settings.switchJKSVPath || inputDir;
        outputName = `${inputName}_switch.dat`;
    } else {
        outputDir = state.settings.pcSavePath || inputDir;
        outputName = `${inputName}_pc.dat`;
    }
    
    const separator = outputDir.includes('\\') ? '\\' : '/';
    state.outputFilePath = outputDir + separator + outputName;
    document.getElementById('output-file-path').value = state.outputFilePath;
    
    showOutputSection();
}

function showOutputSection() {
    document.getElementById('output-section').style.display = 'block';
    showConvertSection();
}

function showConvertSection() {
    if (state.inputFilePath && state.outputFilePath) {
        document.getElementById('convert-section').style.display = 'block';
    }
}

async function performConversion() {
    if (!state.selectedGame || !state.selectedDirection || !state.inputFilePath || !state.outputFilePath) {
        showStatus('error', 'Please select all required options and files.');
        return;
    }
    
    const convertBtn = document.getElementById('convert-btn');
    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';
    
    try {
        const result = await window.electronAPI.convertSave({
            game: state.selectedGame,
            direction: state.selectedDirection,
            inputPath: state.inputFilePath,
            outputPath: state.outputFilePath
        });
        
        if (result.success) {
            showStatus('success', `Conversion successful! Saved to: ${state.outputFilePath}`);
        } else {
            showStatus('error', `Conversion failed: ${result.error || 'Unknown error'}`);
        }
    } catch (error) {
        let errorMessage = error instanceof Error ? error.message : (error.error || error.message || String(error));
        
        if (errorMessage.includes('\n')) {
            const lines = errorMessage.split('\n');
            errorMessage = lines.join(' | ');
        }
        
        showStatus('error', `Conversion failed: ${errorMessage}`);
        console.error('Conversion error:', error);
    } finally {
        convertBtn.disabled = false;
        convertBtn.textContent = 'Convert Save File';
    }
}

function showStatus(type, message) {
    if (type === 'success') {
        showToast('success', message);
    } else if (type === 'error') {
        showToast('error', message);
    }
}

function showToast(type, message, duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    const iconSvg = document.createElement('i');
    iconSvg.setAttribute('data-lucide', type === 'success' ? 'check-circle' : 'alert-circle');
    icon.appendChild(iconSvg);
    
    const messageEl = document.createElement('div');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(messageEl);
    container.appendChild(toast);
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

function initializeSettings() {
    const browsePcPathBtn = document.getElementById('browse-pc-path');
    const browseSwitchPathBtn = document.getElementById('browse-switch-path');
    const browseCredentialsPathBtn = document.getElementById('browse-credentials-path');
    const browseBackupPathBtn = document.getElementById('browse-backup-path');
    const browseMetaFileBtn = document.getElementById('browse-meta-file');
    const cloudBackupEnabled = document.getElementById('cloud-backup-enabled');
    const backupPathContainer = document.getElementById('backup-path-container');
    const cloudMetaFileEnabled = document.getElementById('cloud-meta-file-enabled');
    const metaFileOptions = document.getElementById('meta-file-options');
    const metaFileModeRadios = document.querySelectorAll('input[name="meta-file-mode"]');
    const metaFileCustomContainer = document.getElementById('meta-file-custom-container');
    
    // Show/hide backup path based on checkbox
    function updateBackupPathVisibility() {
        backupPathContainer.style.display = cloudBackupEnabled.checked ? 'block' : 'none';
    }
    
    cloudBackupEnabled.addEventListener('change', updateBackupPathVisibility);
    updateBackupPathVisibility(); // Initial state
    
    // Show/hide meta file options based on checkbox
    function updateMetaFileOptionsVisibility() {
        if (metaFileOptions) {
            metaFileOptions.style.display = cloudMetaFileEnabled.checked ? 'block' : 'none';
        }
    }
    
    cloudMetaFileEnabled.addEventListener('change', updateMetaFileOptionsVisibility);
    updateMetaFileOptionsVisibility(); // Initial state
    
    // Show/hide custom path based on selection
    function updateMetaFileCustomVisibility() {
        if (metaFileCustomContainer) {
            const selectedMode = document.querySelector('input[name="meta-file-mode"]:checked')?.value;
            metaFileCustomContainer.style.display = selectedMode === 'custom' ? 'block' : 'none';
        }
    }
    
    metaFileModeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            updateMetaFileCustomVisibility();
            checkForUnsavedChanges();
        });
    });
    updateMetaFileCustomVisibility(); // Initial state
    
    browsePcPathBtn.addEventListener('click', async () => {
        const path = await window.electronAPI.selectDirectory();
        if (path) {
            document.getElementById('pc-save-path').value = path;
        }
    });
    
    browseSwitchPathBtn.addEventListener('click', async () => {
        const path = await window.electronAPI.selectDirectory();
        if (path) {
            document.getElementById('switch-jksv-path').value = path;
        }
    });
    
    browseCredentialsPathBtn.addEventListener('click', async () => {
        const path = await window.electronAPI.selectFile();
        if (path) {
            document.getElementById('cloud-credentials-path').value = path;
        }
    });
    
    browseBackupPathBtn.addEventListener('click', async () => {
        const path = await window.electronAPI.selectDirectory();
        if (path) {
            document.getElementById('backup-path').value = path;
        }
    });
    
    if (browseMetaFileBtn) {
        browseMetaFileBtn.addEventListener('click', async () => {
            const path = await window.electronAPI.selectFile();
            if (path) {
                document.getElementById('meta-file-custom-path').value = path;
            }
        });
    }
    
    // Connect floating save button
    const saveSettingsBtnFloating = document.getElementById('save-settings-btn-floating');
    if (saveSettingsBtnFloating) {
        saveSettingsBtnFloating.addEventListener('click', async () => {
            await saveSettings();
        });
    }
    
    // Connect floating cancel button
    const cancelSettingsBtnFloating = document.getElementById('cancel-settings-btn-floating');
    if (cancelSettingsBtnFloating) {
        cancelSettingsBtnFloating.addEventListener('click', () => {
            restoreOriginalSettings();
        });
    }
    
    // Track changes to all settings inputs
    const settingsInputs = [
        'pc-save-path',
        'switch-jksv-path',
        'cloud-credentials-path',
        'cloud-backup-enabled',
        'backup-path',
        'cloud-meta-file-enabled',
        'meta-file-custom-path'
    ];
    
    // Add change listeners to all settings inputs
    settingsInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', checkForUnsavedChanges);
            input.addEventListener('input', checkForUnsavedChanges);
        }
    });
    
    // Track browse button changes (they update inputs)
    const browseButtons = [
        browsePcPathBtn,
        browseSwitchPathBtn,
        browseCredentialsPathBtn,
        browseBackupPathBtn,
        browseMetaFileBtn
    ];
    
    browseButtons.forEach(btn => {
        if (btn) {
            const originalClick = btn.onclick;
            btn.addEventListener('click', () => {
                setTimeout(checkForUnsavedChanges, 100); // Check after path is set
            });
        }
    });
}

async function loadSettings() {
    try {
        const settings = await window.electronAPI.readSettings();
        state.settings = settings;
        // Store a deep copy of original settings for comparison
        state.originalSettings = JSON.parse(JSON.stringify(settings));
        
        document.getElementById('pc-save-path').value = settings.pcSavePath || '';
        document.getElementById('switch-jksv-path').value = settings.switchJKSVPath || '';
        
        // Cloud sync settings
        if (settings.cloudSync) {
            document.getElementById('cloud-credentials-path').value = settings.cloudSync.googleDrive?.credentialsPath || '';
            document.getElementById('cloud-backup-enabled').checked = settings.cloudSync.createBackups !== false;
            document.getElementById('backup-path').value = settings.cloudSync.backupPath || '';
            
            // Meta file settings
            const metaFileEnabled = settings.cloudSync.metaFile?.enabled !== undefined 
                ? settings.cloudSync.metaFile.enabled 
                : true; // Default to enabled
            document.getElementById('cloud-meta-file-enabled').checked = metaFileEnabled;
            const metaFileOptions = document.getElementById('meta-file-options');
            if (metaFileOptions) {
                metaFileOptions.style.display = metaFileEnabled ? 'block' : 'none';
            }
            
            const metaFileMode = settings.cloudSync.metaFile?.mode || 'auto';
            const modeRadios = document.querySelectorAll('input[name="meta-file-mode"]');
            modeRadios.forEach(radio => {
                if (radio.value === metaFileMode) {
                    radio.checked = true;
                }
            });
            
            const customPath = settings.cloudSync.metaFile?.customPath || '';
            const customPathInput = document.getElementById('meta-file-custom-path');
            if (customPathInput) {
                customPathInput.value = customPath;
            }
            
            const customContainer = document.getElementById('meta-file-custom-container');
            if (customContainer) {
                customContainer.style.display = metaFileMode === 'custom' ? 'block' : 'none';
            }
        }
        
        // Hide unsaved changes indicator after loading
        hideUnsavedChangesIndicator();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function getCurrentSettings() {
    const metaFileEnabled = document.getElementById('cloud-meta-file-enabled').checked;
    const metaFileMode = document.querySelector('input[name="meta-file-mode"]:checked')?.value || 'auto';
    const metaFileCustomPath = document.getElementById('meta-file-custom-path').value || '';
    
    return {
        pcSavePath: document.getElementById('pc-save-path').value,
        switchJKSVPath: document.getElementById('switch-jksv-path').value,
        cloudSync: {
            enabled: state.settings.cloudSync?.enabled || false,
            provider: 'google',
            createBackups: document.getElementById('cloud-backup-enabled').checked,
            backupPath: document.getElementById('backup-path').value || '',
            metaFile: {
                enabled: metaFileEnabled,
                mode: metaFileMode,
                customPath: metaFileMode === 'custom' ? metaFileCustomPath : ''
            },
            googleDrive: {
                credentialsPath: document.getElementById('cloud-credentials-path').value,
                folderId: state.settings.cloudSync?.googleDrive?.folderId || ''
            }
        }
    };
}

function settingsEqual(settings1, settings2) {
    return JSON.stringify(settings1) === JSON.stringify(settings2);
}

function checkForUnsavedChanges() {
    if (!state.originalSettings) return;
    
    const currentSettings = getCurrentSettings();
    const hasChanges = !settingsEqual(currentSettings, state.originalSettings);
    
    if (hasChanges) {
        showUnsavedChangesIndicator();
    } else {
        hideUnsavedChangesIndicator();
    }
}

function showUnsavedChangesIndicator() {
    const indicator = document.getElementById('unsaved-changes-indicator');
    if (indicator) {
        indicator.style.display = 'block';
    }
}

function hideUnsavedChangesIndicator() {
    const indicator = document.getElementById('unsaved-changes-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

function restoreOriginalSettings() {
    if (!state.originalSettings) return;
    
    const original = state.originalSettings;
    
    // Restore all settings to original values
    document.getElementById('pc-save-path').value = original.pcSavePath || '';
    document.getElementById('switch-jksv-path').value = original.switchJKSVPath || '';
    
    if (original.cloudSync) {
        document.getElementById('cloud-credentials-path').value = original.cloudSync.googleDrive?.credentialsPath || '';
        const cloudBackupEnabled = document.getElementById('cloud-backup-enabled');
        cloudBackupEnabled.checked = original.cloudSync.createBackups !== false;
        document.getElementById('backup-path').value = original.cloudSync.backupPath || '';
        
        // Meta file settings
        const metaFileEnabled = original.cloudSync.metaFile?.enabled !== undefined 
            ? original.cloudSync.metaFile.enabled 
            : true;
        const cloudMetaFileEnabled = document.getElementById('cloud-meta-file-enabled');
        cloudMetaFileEnabled.checked = metaFileEnabled;
        const metaFileOptions = document.getElementById('meta-file-options');
        if (metaFileOptions) {
            metaFileOptions.style.display = metaFileEnabled ? 'block' : 'none';
        }
        
        const metaFileMode = original.cloudSync.metaFile?.mode || 'auto';
        const modeRadios = document.querySelectorAll('input[name="meta-file-mode"]');
        modeRadios.forEach(radio => {
            radio.checked = radio.value === metaFileMode;
        });
        
        const customPath = original.cloudSync.metaFile?.customPath || '';
        const customPathInput = document.getElementById('meta-file-custom-path');
        if (customPathInput) {
            customPathInput.value = customPath;
        }
        
        const customContainer = document.getElementById('meta-file-custom-container');
        if (customContainer) {
            customContainer.style.display = metaFileMode === 'custom' ? 'block' : 'none';
        }
    }
    
    // Update state
    state.settings = JSON.parse(JSON.stringify(original));
    
    // Hide unsaved changes indicator
    hideUnsavedChangesIndicator();
    
    showStatus('success', 'Settings restored to original values');
}

async function saveSettings() {
    const settings = getCurrentSettings();
    
    try {
        const result = await window.electronAPI.writeSettings(settings);
        if (result.success) {
            state.settings = settings;
            state.originalSettings = JSON.parse(JSON.stringify(settings)); // Update original
            hideUnsavedChangesIndicator();
            showStatus('success', 'Settings saved successfully!');
        } else {
            showStatus('error', `Failed to save settings: ${result.error || 'Unknown error'}`);
        }
    } catch (error) {
        showStatus('error', `Error saving settings: ${error.message || 'Unknown error'}`);
    }
}

// Modal Dialog Functions
function showModal(title, message, showInput = false, defaultValue = '') {
    return new Promise((resolve) => {
        const overlay = document.getElementById('modal-overlay');
        const titleEl = document.getElementById('modal-title');
        const messageEl = document.getElementById('modal-message');
        const inputEl = document.getElementById('modal-input');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');
        const closeBtn = document.getElementById('modal-close');

        titleEl.textContent = title;
        messageEl.textContent = message;
        
        if (showInput) {
            inputEl.style.display = 'block';
            inputEl.value = defaultValue;
            inputEl.placeholder = '';
        } else {
            inputEl.style.display = 'none';
        }

        overlay.style.display = 'flex';

        const cleanup = () => {
            overlay.style.display = 'none';
            inputEl.value = '';
        };

        const handleConfirm = () => {
            const value = showInput ? inputEl.value.trim() : true;
            cleanup();
            resolve(value || null);
        };

        const handleCancel = () => {
            cleanup();
            resolve(null);
        };

        confirmBtn.onclick = handleConfirm;
        cancelBtn.onclick = handleCancel;
        closeBtn.onclick = handleCancel;
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                handleCancel();
            }
        };

        // Handle Enter key
        if (showInput) {
            inputEl.focus();
            inputEl.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    handleConfirm();
                } else if (e.key === 'Escape') {
                    handleCancel();
                }
            };
        }
    });
}

// Cloud Sync Functions
function initializeCloudSync() {
    const connectBtn = document.getElementById('connect-cloud-btn');
    const cloudHollowknightToggle = document.getElementById('cloud-hollowknight-toggle');
    const cloudSilksongToggle = document.getElementById('cloud-silksong-toggle');
    const cloudToggleSlider = document.getElementById('cloud-game-toggle-slider');
    
    // Initialize game selection for cloud sync
    state.cloudSyncGame = 'hollowknight';
    updateCloudToggleSlider('hollowknight');
    
    cloudHollowknightToggle.addEventListener('click', () => {
        if (state.cloudSyncGame !== 'hollowknight') {
            state.cloudSyncGame = 'hollowknight';
            updateCloudToggleSlider('hollowknight');
            refreshCloudSlots();
        }
    });
    
    cloudSilksongToggle.addEventListener('click', () => {
        if (state.cloudSyncGame !== 'silksong') {
            state.cloudSyncGame = 'silksong';
            updateCloudToggleSlider('silksong');
            refreshCloudSlots();
        }
    });
    
    connectBtn.addEventListener('click', async () => {
        const btnText = connectBtn.querySelector('.connect-btn-text');
        if (btnText && btnText.textContent === 'Disconnect') {
            await disconnectFromCloud();
        } else {
            await connectToCloud();
        }
    });
    
    // Check connection status on tab switch
    const cloudSyncTab = document.getElementById('cloud-sync-tab');
    const observer = new MutationObserver(() => {
        if (cloudSyncTab.classList.contains('active')) {
            refreshCloudSlots();
        }
    });
    observer.observe(cloudSyncTab, { attributes: true, attributeFilter: ['class'] });
}

function updateCloudToggleSlider(game) {
    const toggleSlider = document.getElementById('cloud-game-toggle-slider');
    const hollowknightToggle = document.getElementById('cloud-hollowknight-toggle');
    const silksongToggle = document.getElementById('cloud-silksong-toggle');
    
    if (game === 'hollowknight') {
        toggleSlider.style.transform = 'translateX(0)';
        hollowknightToggle.classList.add('active');
        silksongToggle.classList.remove('active');
    } else {
        toggleSlider.style.transform = 'translateX(100%)';
        hollowknightToggle.classList.remove('active');
        silksongToggle.classList.add('active');
    }
}

function updateStatusDot(status) {
    const statusDot = document.getElementById('status-dot');
    if (statusDot) {
        statusDot.className = 'status-dot';
        if (status === 'connected') {
            statusDot.classList.add('connected');
        } else if (status === 'connecting') {
            statusDot.classList.add('connecting');
        }
    }
}


async function disconnectFromCloud() {
    const connectBtn = document.getElementById('connect-cloud-btn');
    const statusEl = document.getElementById('cloud-connection-status');
    const btnText = connectBtn.querySelector('.connect-btn-text');
    
    try {
        // Clear the connection state
        state.cloudConnected = false;
        statusEl.textContent = 'Not connected';
        statusEl.classList.remove('connected');
        if (btnText) {
            btnText.textContent = 'Connect to Google Drive';
        }
        updateStatusDot('disconnected');
        
        // Clear the cloud slots display
        const slotsContainer = document.getElementById('cloud-sync-slots');
        if (slotsContainer) {
            slotsContainer.innerHTML = '';
        }
        
        showToast('success', 'Disconnected from Google Drive');
    } catch (error) {
        showToast('error', `Disconnect error: ${error.message}`);
    }
}

async function connectToCloud() {
    const credentialsPath = state.settings.cloudSync?.googleDrive?.credentialsPath;
    if (!credentialsPath) {
        showToast('error', 'Please set Google Drive credentials path in Settings');
        return;
    }
    
    const connectBtn = document.getElementById('connect-cloud-btn');
    const statusEl = document.getElementById('cloud-connection-status');
    const btnText = connectBtn.querySelector('.connect-btn-text');
    
    connectBtn.disabled = true;
    if (btnText) {
        btnText.textContent = 'Connecting...';
    }
    updateStatusDot('connecting');
    statusEl.textContent = 'Connecting...';
    
    try {
        const result = await window.electronAPI.cloudConnect(credentialsPath);
        
        if (result.needsAuth && result.userCode) {
            // Show device code dialog
            const confirmed = await showModal(
                'Google Drive Authorization',
                `Please visit:\n\n${result.verificationUrl}\n\nAnd enter this code:\n\n${result.userCode}\n\nClick OK to start waiting for authorization...`,
                false
            );
            
            if (confirmed) {
                // Start polling for token
                statusEl.textContent = 'Waiting for authorization...';
                showToast('success', `Visit ${result.verificationUrl} and enter code: ${result.userCode}`);
                
                // Poll for token (this will block until user authorizes or timeout)
                const authResult = await window.electronAPI.cloudCompleteAuth(credentialsPath);
                
                if (authResult.success) {
                    state.cloudConnected = true;
                    statusEl.textContent = 'Connected';
                    statusEl.classList.add('connected');
                    if (btnText) {
                        btnText.textContent = 'Disconnect';
                    }
                    updateStatusDot('connected');
                    showToast('success', 'Successfully connected to Google Drive!');
                    refreshCloudSlots();
                } else {
                    if (btnText) {
                        btnText.textContent = 'Connect to Google Drive';
                    }
                    updateStatusDot('disconnected');
                    statusEl.textContent = 'Not connected';
                    statusEl.classList.remove('connected');
                    showToast('error', `Authentication failed: ${authResult.error}`);
                }
            } else {
                if (btnText) {
                    btnText.textContent = 'Connect to Google Drive';
                }
                updateStatusDot('disconnected');
                statusEl.textContent = 'Not connected';
                statusEl.classList.remove('connected');
            }
        } else if (result.success) {
            state.cloudConnected = true;
            statusEl.textContent = 'Connected';
            statusEl.classList.add('connected');
            if (btnText) {
                btnText.textContent = 'Disconnect';
            }
            updateStatusDot('connected');
            showToast('success', 'Successfully connected to Google Drive!');
            refreshCloudSlots();
        } else {
            if (btnText) {
                btnText.textContent = 'Connect to Google Drive';
            }
            updateStatusDot('disconnected');
            statusEl.textContent = 'Not connected';
            statusEl.classList.remove('connected');
            showToast('error', `Connection failed: ${result.error}`);
        }
    } catch (error) {
        if (btnText) {
            btnText.textContent = 'Connect to Google Drive';
        }
        updateStatusDot('disconnected');
        statusEl.textContent = 'Not connected';
        statusEl.classList.remove('connected');
        showToast('error', `Connection error: ${error.message}`);
    } finally {
        connectBtn.disabled = false;
    }
}

async function getPcSavePath() {
    // Use setting if available, otherwise get default path
    if (state.settings.pcSavePath) {
        return state.settings.pcSavePath;
    }
    
    const defaultPathResult = await window.electronAPI.getDefaultSavePath(state.cloudSyncGame);
    if (defaultPathResult.success) {
        return defaultPathResult.path;
    }
    
    return '';
}

async function refreshCloudSlots() {
    if (!state.cloudConnected) {
        const slotsContainer = document.getElementById('cloud-sync-slots');
        slotsContainer.innerHTML = '';
        return;
    }
    
    const slotsContainer = document.getElementById('cloud-sync-slots');
    slotsContainer.innerHTML = `
        <div class="loading-container">
            <div class="loader"></div>
            <p>Loading...</p>
        </div>
    `;
    
    try {
        const pcPath = await getPcSavePath();
        const slots = [];
        
        // Compare all slots
        for (let slot = 1; slot <= 4; slot++) {
            const separator = pcPath.includes('\\') ? '\\' : '/';
            const localPath = pcPath ? `${pcPath}${separator}user${slot}.dat` : '';
            const comparison = await window.electronAPI.cloudCompareSlot(
                state.cloudSyncGame,
                slot,
                localPath
            );
            
            if (comparison.success) {
                slots.push({
                    slot: slot,
                    ...comparison.comparison
                });
            }
        }
        
        renderCloudSlots(slots);
    } catch (error) {
        slotsContainer.innerHTML = `<p style="text-align: center; color: var(--accent-amber);">Error: ${error.message}</p>`;
    }
}

function renderCloudSlots(slots) {
    const container = document.getElementById('cloud-sync-slots');
    container.innerHTML = '';
    
    if (slots.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No saves found</p>';
        return;
    }
    
    slots.forEach(slotData => {
        const slotCard = document.createElement('div');
        slotCard.className = 'slot-card-cloud';
        slotCard.dataset.slot = slotData.slot;
        
        const statusBadge = getStatusBadge(slotData.status);
        const localTime = slotData.localTime ? formatDate(new Date(slotData.localTime)) : 'N/A';
        const cloudTime = slotData.cloudTime ? formatDate(new Date(slotData.cloudTime)) : 'N/A';
        
        slotCard.innerHTML = `
            <div class="slot-header-cloud">
                <span class="slot-title-cloud">Slot ${slotData.slot}</span>
                <span class="sync-status-badge ${statusBadge.class}">${statusBadge.text}</span>
            </div>
            <div class="slot-timestamps">
                <div class="timestamp-item">
                    <i data-lucide="hard-drive"></i>
                    <span>Local: ${localTime}</span>
                </div>
                <div class="timestamp-item">
                    <i data-lucide="cloud"></i>
                    <span>Cloud: ${cloudTime}</span>
                </div>
            </div>
            <div class="slot-actions">
                <button class="slot-upload-btn" data-slot="${slotData.slot}">Upload</button>
                <button class="slot-download-btn" data-slot="${slotData.slot}" data-file-id="${slotData.cloudFile?.id || ''}" data-save-id="${slotData.cloudFile?.saveId || ''}">Download</button>
            </div>
        `;
        
        // Add event listeners
        const uploadBtn = slotCard.querySelector('.slot-upload-btn');
        const downloadBtn = slotCard.querySelector('.slot-download-btn');
        
        uploadBtn.addEventListener('click', () => uploadSlot(slotData.slot));
        downloadBtn.addEventListener('click', () => downloadSlot(slotData.slot, slotData.cloudFile));
        
        container.appendChild(slotCard);
    });
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function getStatusBadge(status) {
    const badges = {
        'in-sync': { class: 'status-in-sync', text: '🟢 In sync' },
        'local-newer': { class: 'status-local-newer', text: '🟡 Local newer' },
        'cloud-newer': { class: 'status-cloud-newer', text: '🔴 Cloud newer' },
        'local-only': { class: 'status-local-only', text: '⚪ Local only' },
        'cloud-only': { class: 'status-cloud-only', text: '⚫ Cloud only' }
    };
    return badges[status] || { class: '', text: 'Unknown' };
}

function formatDate(date) {
    if (!date || isNaN(date.getTime())) return 'N/A';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

async function uploadSlot(slotNumber) {
    const pcPath = await getPcSavePath();
    if (!pcPath) {
        showToast('error', 'Could not find PC save path. Please set it in Settings or ensure the game is installed.');
        return;
    }
    
    const separator = pcPath.includes('\\') ? '\\' : '/';
    const localPath = `${pcPath}${separator}user${slotNumber}.dat`;
    
    // Generate timestamp
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const defaultName = `PC - ${timestamp}`;
    
    const saveName = await showModal('Upload Save', 'Enter a name for this save backup:', true, defaultName);
    if (!saveName) return;
    
    const createBackup = state.settings.cloudSync?.createBackups !== false;
    
    try {
        showToast('success', `Uploading slot ${slotNumber}...`);
        const result = await window.electronAPI.cloudUploadSlot(
            state.cloudSyncGame,
            slotNumber,
            localPath,
            saveName,
            createBackup
        );
        
        if (result.success) {
            showToast('success', `Successfully uploaded slot ${slotNumber} to cloud!`);
            refreshCloudSlots();
        } else {
            showToast('error', `Upload failed: ${result.error}`);
        }
    } catch (error) {
        showToast('error', `Upload error: ${error.message}`);
    }
}

async function downloadSlot(slotNumber, cloudFile) {
    if (!cloudFile || !cloudFile.id) {
        showToast('error', 'No cloud save found for this slot');
        return;
    }
    
    const pcPath = await getPcSavePath();
    if (!pcPath) {
        showToast('error', 'Could not find PC save path. Please set it in Settings or ensure the game is installed.');
        return;
    }
    
    const separator = pcPath.includes('\\') ? '\\' : '/';
    const localPath = `${pcPath}${separator}user${slotNumber}.dat`;
    const createBackup = state.settings.cloudSync?.createBackups !== false;
    
    try {
        showToast('success', `Downloading slot ${slotNumber}...`);
        const result = await window.electronAPI.cloudDownloadSlot(
            state.cloudSyncGame,
            slotNumber,
            localPath,
            cloudFile.saveId || '',
            cloudFile.id,
            cloudFile.entryName || `user${slotNumber}.dat`,
            createBackup
        );
        
        if (result.success) {
            showToast('success', `Successfully downloaded slot ${slotNumber} from cloud!`);
            refreshCloudSlots();
        } else {
            showToast('error', `Download failed: ${result.error}`);
        }
    } catch (error) {
        showToast('error', `Download error: ${error.message}`);
    }
}


// dust particle system for that desolate vibe
function initializeParticleSystem() {
    const canvas = document.getElementById('dust-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;
    
    const dustColors = [
        'rgba(120, 170, 220, 0.7)',
        'rgba(100, 150, 200, 0.65)',
        'rgba(110, 160, 210, 0.6)',
        'rgba(90, 140, 190, 0.55)',
        'rgba(130, 180, 230, 0.65)'
    ];
    
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            
            this.vx = (Math.random() - 0.5) * 0.3 - 0.1; // slight leftward drift
            this.vy = (Math.random() - 0.5) * 0.2;
            
            this.size = Math.random() * 2 + 1;
            this.color = dustColors[Math.floor(Math.random() * dustColors.length)];
            this.opacity = Math.random() * 0.3 + 0.4;
            
            this.driftX = (Math.random() - 0.5) * 0.05;
            this.driftY = (Math.random() - 0.5) * 0.03;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            this.vx += this.driftX * 0.01;
            this.vy += this.driftY * 0.01;
            
            this.vx *= 0.999;
            this.vy *= 0.999;
            
            if (Math.abs(this.vx) > 0.5) this.vx *= 0.9;
            if (Math.abs(this.vy) > 0.5) this.vy *= 0.9;
            
            if (this.x < 0) {
                this.x = canvas.width;
            } else if (this.x > canvas.width) {
                this.x = 0;
            }
            
            if (this.y < 0) {
                this.y = canvas.height;
            } else if (this.y > canvas.height) {
                this.y = 0;
            }
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    function initParticles() {
        particles = [];
        const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
        
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        animationFrameId = requestAnimationFrame(animate);
    }
    
    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });
    
    resizeCanvas();
    initParticles();
    animate();
    
    return () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    };
}

