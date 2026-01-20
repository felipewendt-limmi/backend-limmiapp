const { Client, Product } = require('../../models');

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Client Stats
        const totalClients = await Client.count();
        const activeClients = await Client.count({ where: { isActive: true } });

        // 2. Product Stats
        const totalProducts = await Product.count();
        const activeProducts = await Product.count({ where: { isActive: true } });

        // 3. Recent Clients (Activity)
        const recentClients = await Client.findAll({
            order: [['createdAt', 'DESC']],
            limit: 5,
            attributes: ['id', 'name', 'slug', 'isActive', 'createdAt']
        });

        // 4. Mock Order Data (Since we don't have Orders yet)
        const mockRevenue = 12450.00; // Fixed for now
        const mockActiveOrders = 12;

        res.json({
            clients: {
                total: totalClients,
                active: activeClients,
                recent: recentClients
            },
            products: {
                total: totalProducts,
                active: activeProducts
            },
            sales: {
                revenue: mockRevenue,
                activeOrders: mockActiveOrders
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
};
