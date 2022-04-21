import Router from "express";
import systemController from "../controllers/systemController/systemController.js";
import Meeting from "../models/Meeting.js";

const router = new Router();

// router.get(
//     '/dump',
//     systemController.createDUMP,
// )
//
// router.post(
//     '/recover',
//     systemController.recover,
// )
//
// router.post(
//     '/fix',
//     async (req, resp) => {
//         await Meeting.syncIndexes();
//     },
// )

export default router;
