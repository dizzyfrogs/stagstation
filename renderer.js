let state = {
    selectedGame: null,
    selectedDirection: null,
    inputFilePath: null,
    outputFilePath: null,
    settings: {
        pcSavePath: '',
        switchJKSVPath: ''
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    initializeWindowControls();
    initializeTabs();
    initializeGameSelection();
    initializeDirectionSelection();
    initializeFileSelection();
    initializeSettings();
    await loadSettings();
    
    initializeParticleSystem();
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    document.getElementById('conversion-section').style.display = 'block';
});

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
    if (document.getElementById('settings-tab').classList.contains('active')) {
        const settingsStatus = document.getElementById('settings-status');
        settingsStatus.className = `status-message ${type}`;
        settingsStatus.textContent = message;
    }
    
    if (type === 'success') {
        showToast('success', message);
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
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    
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
    
    saveSettingsBtn.addEventListener('click', async () => {
        await saveSettings();
    });
}

async function loadSettings() {
    try {
        const settings = await window.electronAPI.readSettings();
        state.settings = settings;
        document.getElementById('pc-save-path').value = settings.pcSavePath || '';
        document.getElementById('switch-jksv-path').value = settings.switchJKSVPath || '';
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings() {
    const settings = {
        pcSavePath: document.getElementById('pc-save-path').value,
        switchJKSVPath: document.getElementById('switch-jksv-path').value
    };
    
    try {
        const result = await window.electronAPI.writeSettings(settings);
        if (result.success) {
            state.settings = settings;
            showStatus('success', 'Settings saved successfully!');
        } else {
            showStatus('error', `Failed to save settings: ${result.error || 'Unknown error'}`);
        }
    } catch (error) {
        showStatus('error', `Error saving settings: ${error.message || 'Unknown error'}`);
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

