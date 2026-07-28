"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const apiResponse_1 = require("../utils/apiResponse");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    let dbStatus = 'disconnected';
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        dbStatus = 'connected';
    }
    catch (err) {
        dbStatus = 'unavailable';
    }
    return (0, apiResponse_1.successResponse)(res, 200, 'DevProof API Service is healthy', {
        status: 'UP',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus,
        uptimeSeconds: Math.floor(process.uptime())
    });
});
exports.default = router;
