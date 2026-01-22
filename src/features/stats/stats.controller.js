const { Client, Product } = require('../../models');

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Fetch all clients with their products to aggregate in memory (simpler for MVP than complex SQL grouping)
        // For distinct categories, memory aggregation is easier unless using specific SQL dialects.
        const clientsRaw = await Client.findAll({
            include: [{
                model: Product,
                as: 'products',
                attributes: ['id', 'category', 'views', 'favoritesCount', 'isActive']
            }],
            order: [['createdAt', 'DESC']]
        });

        // 2. Global Aggregations
        let totalViews = 0;
        let totalFavorites = 0;
        let totalProducts = 0;
        let totalActiveProducts = 0;

        const detailedClients = clientsRaw.map(client => {
            const products = client.products || [];

            const productCount = products.length;
            const activeProductCount = products.filter(p => p.isActive).length;

            // Views & Favorites
            const clientViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
            const clientFavorites = products.reduce((sum, p) => sum + (p.favoritesCount || 0), 0);

            // Distinct Categories
            const categories = new Set(products.map(p => p.category).filter(Boolean));

            // Add to globals
            totalViews += clientViews;
            totalFavorites += clientFavorites;
            totalProducts += productCount;
            totalActiveProducts += activeProductCount;

            return {
                id: client.id,
                name: client.name,
                slug: client.slug,
                isActive: client.isActive,
                createdAt: client.createdAt,
                stats: {
                    products: productCount,
                    categories: categories.size,
                    views: clientViews,
                    favorites: clientFavorites
                }
            };
        });

        // 3. Client Counts
        const totalClients = clientsRaw.length;
        const activeClients = clientsRaw.filter(c => c.isActive).length;

        // 4. Mock Financials (still mock for now as we don't have real orders yet)
        const mockRevenue = 12450.00;

        res.json({
            global: {
                clients: { total: totalClients, active: activeClients },
                products: { total: totalProducts, active: totalActiveProducts },
                engagement: { views: totalViews, favorites: totalFavorites }
            },
            sales: {
                revenue: mockRevenue,
            },
            clients: detailedClients // This list acts as the table data
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
};
