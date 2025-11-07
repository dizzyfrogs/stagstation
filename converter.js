const crypto = require('crypto');
const fs = require('fs').promises;

// encryption key for the saves
const AES_KEY = Buffer.from('UKu52ePUBwetZ9wNX88o54dnfKRu0T1l', 'ascii');

// C# binary header that PC saves have
const C_SHARP_HEADER = Buffer.from([0, 1, 0, 0, 0, 255, 255, 255, 255, 1, 0, 0, 0, 0, 0, 0, 0, 6, 1, 0, 0, 0]);

// generates the length prefix thing that C# uses
function generateLengthPrefixedString(dataLength) {
    let length = Math.min(0x7FFFFFFF, dataLength);
    const bytes = [];
    
    for (let i = 0; i < 4; i++) {
        if (length >> 7 !== 0) {
            bytes.push((length & 0x7F) | 0x80);
            length >>= 7;
        } else {
            bytes.push(length & 0x7F);
            length >>= 7;
            break;
        }
    }
    
    if (length !== 0) {
        bytes.push(length);
    }
    
    return Buffer.from(bytes);
}

// strips the C# header stuff from PC saves
function removeHeader(data) {
    if (data.length < 23) {
        throw new Error('File too short to contain header and ending byte');
    }
    
    if (!data.slice(0, 22).equals(C_SHARP_HEADER)) {
        throw new Error('File does not start with expected C# binary header');
    }
    
    let bytes = data.slice(22, -1);
    
    // find where the length prefix ends
    let lengthCount = 0;
    for (let i = 0; i < Math.min(5, bytes.length); i++) {
        lengthCount++;
        if ((bytes[i] & 0x80) === 0) {
            break;
        }
    }
    
    if (lengthCount >= bytes.length) {
        throw new Error('Could not find end of LengthPrefixedString header');
    }
    
    return bytes.slice(lengthCount);
}

// adds the C# header back to make it a PC save
function addHeader(data) {
    const lengthData = generateLengthPrefixedString(data.length);
    
    const totalLength = C_SHARP_HEADER.length + lengthData.length + data.length + 1;
    const newBytes = Buffer.alloc(totalLength);
    let offset = 0;
    
    C_SHARP_HEADER.copy(newBytes, offset);
    offset += C_SHARP_HEADER.length;
    
    lengthData.copy(newBytes, offset);
    offset += lengthData.length;
    
    data.copy(newBytes, offset);
    offset += data.length;
    
    newBytes[offset] = 11;
    
    return newBytes;
}

// converts PC save to Switch format (decrypts it)
async function pcToSwitch(inputPath, outputPath) {
    try {
        const fileData = await fs.readFile(inputPath);
        
        if (fileData.length === 0) {
            throw new Error('Input file is empty');
        }
        
        // strip the C# header
        const encryptedData = removeHeader(fileData);
        
        // extract base64 data, skip whitespace
        const base64Bytes = [];
        for (let i = 0; i < encryptedData.length; i++) {
            const b = encryptedData[i];
            if ((b >= 65 && b <= 90) || (b >= 97 && b <= 122) || (b >= 48 && b <= 57) || 
                b === 43 || b === 47 || b === 61) {
                base64Bytes.push(b);
            } else if (b === 0) {
                break;
            }
        }
        
        if (base64Bytes.length === 0) {
            throw new Error(`After header removal, no valid Base64 data found (got ${encryptedData.length} bytes)`);
        }
        
        const base64String = Buffer.from(base64Bytes).toString('ascii');
        let decodedBuffer;
        try {
            decodedBuffer = Buffer.from(base64String, 'base64');
        } catch (error) {
            throw new Error(`Base64 decode failed: ${error.message}. Base64 string length: ${base64String.length}, first 50 chars: ${base64String.substring(0, 50)}`);
        }
        
        if (decodedBuffer.length === 0) {
            throw new Error('Base64 decoded data is empty');
        }
        
        // decrypt with AES-256-ECB
        if (decodedBuffer.length % 16 !== 0) {
            throw new Error(`Decoded buffer length (${decodedBuffer.length}) is not a multiple of 16 (AES block size)`);
        }
        
        let decryptedData;
        try {
            const cipher = crypto.createDecipheriv('aes-256-ecb', AES_KEY, Buffer.alloc(0));
            cipher.setAutoPadding(false);
            decryptedData = Buffer.concat([cipher.update(decodedBuffer), cipher.final()]);
        } catch (error) {
            if (error.message.includes('ecb') || error.message.includes('ECB')) {
                throw new Error(`AES-ECB mode not supported: ${error.message}. This may require a different Node.js version or OpenSSL configuration.`);
            }
            throw new Error(`AES decrypt failed: ${error.message}. Key length: ${AES_KEY.length}, Decoded buffer length: ${decodedBuffer.length}`);
        }
        
        if (decryptedData.length === 0) {
            throw new Error('Decrypted data is empty - wrong key or corrupted file');
        }
        
        // remove PKCS7 padding
        const padValue = decryptedData[decryptedData.length - 1];
        if (padValue < 1 || padValue > 16) {
            const lastBytes = Array.from(decryptedData.slice(-20)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ');
            throw new Error(`Invalid padding value: ${padValue} (should be 1-16). Last 20 bytes: ${lastBytes}. Decrypted data length: ${decryptedData.length}. This suggests decryption failed - wrong key or corrupted data.`);
        }
        
        for (let i = decryptedData.length - padValue; i < decryptedData.length; i++) {
            if (decryptedData[i] !== padValue) {
                throw new Error(`Invalid PKCS7 padding: padding bytes are not all equal to ${padValue}`);
            }
        }
        
        decryptedData = decryptedData.slice(0, -padValue);
        
        await fs.writeFile(outputPath, decryptedData);
        
        console.log(`Successfully converted PC save to Switch format: ${outputPath}`);
        return true;
        
    } catch (error) {
        console.error(`Error converting PC to Switch: ${error.message}`);
        throw error;
    }
}

// converts Switch save to PC format (encrypts it)
async function switchToPc(inputPath, outputPath) {
    try {
        let plainData = await fs.readFile(inputPath);
        
        if (plainData.length === 0) {
            throw new Error('Input file is empty');
        }
        
        // remove BOM if it's there
        if (plainData[0] === 0xEF && plainData[1] === 0xBB && plainData[2] === 0xBF) {
            plainData = plainData.slice(3);
        }
        
        plainData = Buffer.from(plainData.toString('utf8').trim(), 'utf8');
        
        // add PKCS7 padding
        const padValue = 16 - (plainData.length % 16);
        const paddedData = Buffer.alloc(plainData.length + padValue);
        paddedData.fill(padValue);
        plainData.copy(paddedData);
        
        // encrypt with AES-256-ECB
        const cipher = crypto.createCipheriv('aes-256-ecb', AES_KEY, Buffer.alloc(0));
        cipher.setAutoPadding(false);
        
        const encryptedData = Buffer.concat([cipher.update(paddedData), cipher.final()]);
        
        // base64 encode it
        const encodedData = Buffer.from(encryptedData.toString('base64'), 'ascii');
        
        // add the C# header back
        const finalData = addHeader(encodedData);
        
        await fs.writeFile(outputPath, finalData);
        
        console.log(`Successfully converted Switch save to PC format: ${outputPath}`);
        return true;
        
    } catch (error) {
        console.error(`Error converting Switch to PC: ${error.message}`);
        throw error;
    }
}

// cli entry point if you run this directly
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length !== 4) {
        console.error('Usage: converter.js <game> <direction> <input_path> <output_path>');
        console.error('  game: "hollowknight" or "silksong"');
        console.error('  direction: "pc-to-switch" or "switch-to-pc"');
        process.exit(1);
    }
    
    const game = args[0].toLowerCase();
    const direction = args[1].toLowerCase();
    const inputPath = args[2];
    const outputPath = args[3];
    
    if (game !== 'hollowknight' && game !== 'silksong') {
        console.error(`Error: Unknown game '${game}'. Must be 'hollowknight' or 'silksong'`);
        process.exit(1);
    }
    
    try {
        let success = false;
        if (direction === 'pc-to-switch') {
            success = await pcToSwitch(inputPath, outputPath);
        } else if (direction === 'switch-to-pc') {
            success = await switchToPc(inputPath, outputPath);
        } else {
            console.error(`Error: Unknown direction '${direction}'. Must be 'pc-to-switch' or 'switch-to-pc'`);
            process.exit(1);
        }
        
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error(`Conversion failed: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { pcToSwitch, switchToPc };

