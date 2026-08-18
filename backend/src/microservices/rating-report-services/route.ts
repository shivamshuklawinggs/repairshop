import { Router } from 'express';
import {  addCustomerReport,getAverageReportRating, getCustomerReports, deleteCustomerReport,addCarrierReport,getCarrierReports,deleteCarrierReport,addDriverReport,getDriverReports,deleteDriverReport } from './customer-rating.controller';
import { Middleware } from 'middlewares';
import { REPORT_DIR } from 'config';

const router = Router();

// Apply auth middleware to all routes
router.use(Middleware.verifyToken);

// Add a comment to customer rating
// when  we are suppoesed to delete the comment We assume Customerid is commentId
// when we are use get we are using customerId as customerId
router.route('/customer/:customerId/comments').post(Middleware.upload({
    destination:REPORT_DIR,
    fileSize:1,
    maxFiles:1,
}).single("file"),Middleware.decryptDataMiddleware, addCustomerReport)
.get(Middleware.decryptDataMiddleware, getCustomerReports)
.delete(Middleware.decryptDataMiddleware, deleteCustomerReport)
// Add a comment to customer rating
// when  we are suppoesed to delete the comment We assume Customerid is commentId
// when we are use get we are using customerId as customerId
router.route('/carrier/:carrierId/comments').post(Middleware.upload({
    destination:REPORT_DIR,
    fileSize:1,
    maxFiles:1,
}).single("file"),Middleware.decryptDataMiddleware, addCarrierReport)
.get(Middleware.decryptDataMiddleware, getCarrierReports)
.delete(Middleware.decryptDataMiddleware, deleteCarrierReport)

// Driver report routes
router.route('/driver/:driverId/comments').post(Middleware.upload({
    destination:REPORT_DIR,
    fileSize:1,
    maxFiles:1,
}).single("file"),Middleware.decryptDataMiddleware, addDriverReport)
.get(Middleware.decryptDataMiddleware, getDriverReports)
.delete(Middleware.decryptDataMiddleware, deleteDriverReport)
// Get average report rating
router.get('/getAverageReportRating/:entityId/:entityType', Middleware.decryptDataMiddleware, getAverageReportRating);

export default router;