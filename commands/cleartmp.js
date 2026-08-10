const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

// Function to clear a single directory
function clearDirectory(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            return { success: false, message: `Directory does not exist: ${dirPath}` };
        }
        const files = fs.readdirSync(dirPath);
        let deletedCount = 0;
        for (const file of files) {
            try {
                const filePath = path.join(dirPath, file);
                const stat = fs.lstatSync(filePath);
                if (stat.isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(filePath);
                }
                deletedCount++;
            } catch (err) {
                // Only log errors
                console.error(`The shadows resisted purging ${file}:`, err);
            }
        }
        return { success: true, message: `Purged ${deletedCount} files from ${path.basename(dirPath)}`, count: deletedCount };
    } catch (error) {
        console.error('The purge ritual failed (clearDirectory error):', error);
        return { success: false, message: `Failed to purge files in ${path.basename(dirPath)}`, error: error.message };
    }
}

// Function to clear both tmp and temp directories
async function clearTmpDirectory() {
    const tmpDir = path.join(process.cwd(), 'tmp');
    const tempDir = path.join(process.cwd(), 'temp');
    const results = [];
    results.push(clearDirectory(tmpDir));
    results.push(clearDirectory(tempDir));
    // Combine results
    const success = results.every(r => r.success);
    const totalDeleted = results.reduce((sum, r) => sum + (r.count || 0), 0);
    const message = results.map(r => r.message).join(' | ');
    return { success, message, count: totalDeleted };
}

// Function to handle manual command
async function clearTmpCommand(sock, chatId, msg) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!msg.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, { 
                text: '👑 Only the Sovereign may command this power!' 
            });
            return;
        }

        const result = await clearTmpDirectory();
        
        if (result.success) {
            await sock.sendMessage(chatId, { 
                text: `👑 ${result.message}` 
            });
        } else {
            await sock.sendMessage(chatId, { 
                text: `💀 ${result.message}` 
            });
        }

    } catch (error) {
        console.error('The purge ritual failed (cleartmp command error):', error);
        await sock.sendMessage(chatId, { 
            text: '💀 The shadows failed to purge the temporary files!' 
        });
    }
}

// Start automatic clearing every 6 hours
function startAutoClear() {
    // Run immediately on startup
    clearTmpDirectory().then(result => {
        if (!result.success) {
            console.error(`[Shadow Auto-Purge] ${result.message}`);
        }
        // No log for success, regardless of count
    });

    // Set interval for every 6 hours
    setInterval(async () => {
        const result = await clearTmpDirectory();
        if (!result.success) {
            console.error(`[Shadow Auto-Purge] ${result.message}`);
        }
        // No log for success, regardless of count
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
}

// Start the automatic clearing
startAutoClear();

module.exports = clearTmpCommand;