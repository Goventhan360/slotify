const { User, Provider } = require('../models');

// GET /api/directory/providers — list all registered providers (doctors)
const getProviders = async (req, res, next) => {
    try {
        const providers = await Provider.findAll({
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
            attributes: ['id', 'specialization', 'phone'],
        });

        res.status(200).json({
            success: true,
            count: providers.length,
            data: providers.map(p => ({
                id: p.id,
                name: p.user?.name || '—',
                email: p.user?.email || '—',
                specialization: p.specialization,
                phone: p.phone,
            })),
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/directory/patients — list all registered patients (for providers)
const getPatients = async (req, res, next) => {
    try {
        const patients = await User.findAll({
            where: { role: 'user' },
            attributes: ['id', 'name', 'email', 'createdAt'],
            order: [['createdAt', 'DESC']],
        });

        res.status(200).json({
            success: true,
            count: patients.length,
            data: patients,
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/directory/public — public list (name/spec only)
const getPublicProviders = async (req, res, next) => {
    try {
        const providers = await Provider.findAll({
            include: [{ model: User, as: 'user', attributes: ['name'] }],
            attributes: ['specialization'],
        });

        res.status(200).json({
            success: true,
            data: providers.map(p => ({
                name: p.user?.name || '—',
                specialization: p.specialization,
            })),
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getProviders, getPatients, getPublicProviders };
