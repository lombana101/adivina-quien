const fs = require('fs');
const path = require('path');
const https = require('https');
const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const CHARACTERS = require('../characters.js').CHARACTERS;

// Crear directorio de imágenes si no existe
const imagesDir = path.join(__dirname, '..', 'images', 'characters');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

async function generateCharacterImage(character) {
    const imagePath = path.join(imagesDir, `character_${character.id}.png`);
    
    // Verificar si la imagen ya existe
    if (fs.existsSync(imagePath)) {
        console.log(`⏭️  Image already exists for character ${character.id}: ${character.name} - skipping`);
        return imagePath;
    }
    
    // Crear prompt descriptivo para DALL-E - hiperrealismo fotográfico
    const moodMapping = {
        'Nervous': 'slightly anxious but friendly expression',
        'Confident': 'confident and cheerful smile',
        'Happy': 'big genuine smile, happy expression',
        'Calm': 'peaceful, relaxed, gentle smile',
        'Smug': 'playful smirk, mischievous but friendly'
    };
    
    const expression = moodMapping[character.mood] || 'friendly, approachable expression with a slight smile';
    
    const prompt = `A hyperrealistic professional photograph of a ridiculous-looking real person. This must look like an actual photo taken with a camera, NOT a drawing, NOT an illustration, NOT 3D render, NOT cartoon, NOT animation style. ONE REAL PERSON ONLY, no duplicates, no multiple people.
    
Person details:
- Height: ${character.height}
- Hair: ${character.hair}
- Shirt: ${character.shirt} colored shirt
- Pants: ${character.pants}
- Accessory: ${character.accessory === 'None' ? 'no accessory' : character.accessory}
- Holding: ${character.prop}
- Pose: ${character.pose}
- Expression: ${expression} - NOT sad, NOT worried, NOT depressed - must be positive, friendly, or playful
- Color accent: ${character.colorAccent}

CRITICAL STYLE REQUIREMENTS:
- Hyperrealistic photography - must look like a real photograph taken with a DSLR camera
- Ridiculous, absurd, funny-looking person - NOT attractive, NOT good-looking
- Awkward proportions, quirky features, comical appearance but still realistic
- Real person with natural skin texture, pores, realistic hair, natural lighting
- Professional portrait photography quality
- Natural lighting with realistic shadows and highlights
- Simple, clean background (solid color or blurred bokeh effect)
- Full body shot, front view
- Single real person only, no duplicates or multiple people
- Positive, friendly, or playful expression - NO sad or worried looks
- Consistent hyperrealistic photography style across all characters
- Natural colors, realistic skin tones, photographic quality
- NO illustration style, NO cartoon style, NO 3D render style, NO animation style
- Must look like an actual candid or portrait photograph of a real, ridiculous-looking human being
- The person should look funny, awkward, or absurd - intentionally not attractive`;

    try {
        console.log(`🔄 Generating image for character ${character.id}: ${character.name}...`);
        
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "vivid"
        });

        const imageUrl = response.data[0].url;
        
        // Descargar la imagen usando https
        await downloadImage(imageUrl, imagePath);
        
        console.log(`✓ Saved image for ${character.name} at ${imagePath}`);
        
        // Esperar un poco para evitar rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return imagePath;
    } catch (error) {
        console.error(`❌ Error generating image for ${character.name}:`, error.message);
        return null;
    }
}

async function generateAllImages() {
    console.log('Starting image generation for all characters...\n');
    
    // Verificar cuántas imágenes ya existen
    const existingImages = CHARACTERS.filter(char => {
        const imagePath = path.join(imagesDir, `character_${char.id}.png`);
        return fs.existsSync(imagePath);
    }).length;
    
    console.log(`📊 Found ${existingImages} existing images out of ${CHARACTERS.length} characters\n`);
    
    const results = [];
    let generated = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const character of CHARACTERS) {
        const imagePath = path.join(imagesDir, `character_${character.id}.png`);
        const alreadyExists = fs.existsSync(imagePath);
        
        if (alreadyExists) {
            skipped++;
            results.push({
                characterId: character.id,
                characterName: character.name,
                imagePath: imagePath,
                success: true,
                skipped: true
            });
        } else {
            const result = await generateCharacterImage(character);
            if (result) {
                generated++;
                results.push({
                    characterId: character.id,
                    characterName: character.name,
                    imagePath: result,
                    success: true,
                    skipped: false
                });
            } else {
                failed++;
                results.push({
                    characterId: character.id,
                    characterName: character.name,
                    imagePath: null,
                    success: false,
                    skipped: false
                });
            }
        }
    }
    
    // Guardar metadata
    const metadata = {
        generatedAt: new Date().toISOString(),
        totalCharacters: CHARACTERS.length,
        existing: existingImages,
        generated: generated,
        skipped: skipped,
        failed: failed,
        results: results
    };
    
    const metadataPath = path.join(__dirname, '..', 'images', 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log('\n=== Generation Complete ===');
    console.log(`Total Characters: ${CHARACTERS.length}`);
    console.log(`✓ Already Existed: ${skipped}`);
    console.log(`🔄 Newly Generated: ${generated}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`\nMetadata saved to: ${metadataPath}`);
    
    if (generated > 0) {
        console.log(`\n💰 Estimated cost: ~$${(generated * 0.04).toFixed(2)} (at $0.04 per image)`);
    }
}

// Función para descargar imagen
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {}); // Eliminar archivo en caso de error
            reject(err);
        });
    });
}

// Ejecutar si se llama directamente
if (require.main === module) {
    if (!process.env.OPENAI_API_KEY) {
        console.error('ERROR: OPENAI_API_KEY not found in environment variables.');
        console.error('Please create a .env file with: OPENAI_API_KEY=your_key_here');
        process.exit(1);
    }
    
    generateAllImages().catch(console.error);
}

module.exports = { generateCharacterImage, generateAllImages };

