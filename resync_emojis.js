const { Category, Client } = require('./src/models');

async function syncEmojis() {
    try {
        console.log("Starting Emoji Sync from Global Catalog...");

        const globalClient = await Client.findOne({ where: { slug: 'global-catalog' } });
        if (!globalClient) {
            console.error("Global Catalog not found");
            return;
        }

        const globalCategories = await Category.findAll({ where: { clientId: globalClient.id } });
        const globalMap = {};
        globalCategories.forEach(c => globalMap[c.name.toLowerCase()] = c.emoji);

        console.log(`Loaded ${globalCategories.length} global categories.`);

        const allCategories = await Category.findAll();
        let updatedCount = 0;

        for (const cat of allCategories) {
            // Skip global catalog itself
            if (cat.clientId === globalClient.id) continue;

            const globalEmoji = globalMap[cat.name.toLowerCase()];
            if (globalEmoji && cat.emoji !== globalEmoji) {
                console.log(`Updating '${cat.name}': ${cat.emoji} -> ${globalEmoji}`);
                await cat.update({ emoji: globalEmoji });
                updatedCount++;
            }
        }

        console.log(`Sync complete. Updated ${updatedCount} categories.`);

    } catch (e) {
        console.error(e);
    }
}

syncEmojis();
