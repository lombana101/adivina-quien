const fs = require('fs');
const https = require('https');
const path = require('path');

// ID del archivo de Google Drive
const FILE_ID = '16_fhGoYY2BjzG751RCUiqWiq7t_M25FY';

// Nota: Para que esto funcione, el archivo de Google Drive debe estar compartido públicamente
// y debes tener el enlace de descarga directa. Alternativamente, puedes descargar el video
// manualmente y colocarlo en la carpeta public/videos/

async function downloadVideo() {
    console.log('Descargando video de inicio de ronda...');
    
    // Intentar diferentes URLs de Google Drive
    const urls = [
        `https://drive.google.com/uc?export=download&id=${FILE_ID}`,
        `https://drive.google.com/uc?export=download&confirm=t&id=${FILE_ID}`
    ];
    
    const videosDir = path.join(__dirname, '..', 'public', 'videos');
    if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
    }
    
    const outputPath = path.join(videosDir, 'round-start.mp4');
    
    for (const url of urls) {
        try {
            console.log(`Intentando descargar desde: ${url}`);
            await downloadFile(url, outputPath);
            console.log(`✓ Video descargado exitosamente en: ${outputPath}`);
            return;
        } catch (error) {
            console.warn(`Error con URL ${url}:`, error.message);
            continue;
        }
    }
    
    console.error('No se pudo descargar el video desde Google Drive.');
    console.log('\nAlternativa:');
    console.log('1. Descarga el video manualmente desde Google Drive');
    console.log('2. Guárdalo como "round-start.mp4" en la carpeta public/videos/');
    console.log('3. El juego lo usará automáticamente');
}

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
            // Google Drive puede redirigir, seguir las redirecciones
            if (response.statusCode === 302 || response.statusCode === 301) {
                https.get(response.headers.location, (redirectResponse) => {
                    if (redirectResponse.statusCode !== 200) {
                        reject(new Error(`Failed to download: ${redirectResponse.statusCode}`));
                        return;
                    }
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                }).on('error', (err) => {
                    fs.unlink(filepath, () => {});
                    reject(err);
                });
            } else if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else {
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

// Ejecutar si se llama directamente
if (require.main === module) {
    downloadVideo().catch(console.error);
}

module.exports = { downloadVideo };

