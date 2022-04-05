import Router from "express";
import systemController from "../controllers/systemController/systemController.js";

const router = new Router();

router.get(
    '/dump',
    systemController.createDUMP,
)

router.post(
    '/recover',
    systemController.recover,
)

export default router;
