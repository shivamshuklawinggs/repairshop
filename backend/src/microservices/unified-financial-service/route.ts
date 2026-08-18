import express from 'express';
import unifiedFinancialController from './unifiedFinancial.controller';
import { Middleware } from 'middlewares';

const { verifyToken } = Middleware;
const router = express.Router();

// Apply authentication middleware
router.use(verifyToken);

// Single unified route for all financial data
router.route('/')
  .get(unifiedFinancialController.getAllFinancialData);

export default router;
