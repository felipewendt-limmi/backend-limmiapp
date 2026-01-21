const { Category } = require('./src/models');
const { Op } = require('sequelize');

async function fixEmojis() {
    try {
        const categories = await Category.findAll();
        console.log(`Found ${categories.length} categories.`);

        for (const cat of categories) {
            let newEmoji = null;
            const lower = cat.name.toLowerCase();

            if (lower.includes('semente')) newEmoji = '🌱';
            else if (lower.includes('grão') || lower.includes('trigo')) newEmoji = '🌾';
            else if (lower.includes('farinha')) newEmoji = '🥡';
            else if (lower.includes('chá')) newEmoji = '🍵';
            else if (lower.includes('tempero') || lower.includes('pimenta')) newEmoji = '🌶️';
            else if (lower.includes('fruta') || lower.includes('damasco')) newEmoji = '🍑';
            else if (lower.includes('castanha') || lower.includes('noze') || lower.includes('amendoa')) newEmoji = '🌰';
            else if (lower.includes('óleo') || lower.includes('azeite')) newEmoji = '🫗';
            else if (lower.includes('suplemento')) newEmoji = '💪';
            else if (lower.includes('doce') || lower.includes('chocolate')) newEmoji = '🍫';
            else if (lower.includes('encap')) newEmoji = '💊';

            if (newEmoji && cat.emoji !== newEmoji) {
                console.log(`Updating ${cat.name}: ${cat.emoji} -> ${newEmoji}`);
                await cat.update({ emoji: newEmoji });
            }
        }
        console.log("Done updating emojis.");
    } catch (e) {
        console.error(e);
    }
}

fixEmojis();
