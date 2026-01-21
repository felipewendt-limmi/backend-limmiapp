const { Client } = require('./src/models');

async function check() {
    try {
        const id = 'c3b746d1-57e8-4b4b-94a8-612499fcd220';
        const client = await Client.findByPk(id);
        if (client) {
            console.log(`Client Found: ${client.name} (${client.slug})`);
        } else {
            console.log("Client not found");
        }
    } catch (e) {
        console.error(e);
    }
}

check();
