import Router from "express";
import statisticsController from "../controllers/statisticsController.js";

const router = new Router();

router.get(
    '/users',
    statisticsController.groupsAndCourses,
)

export default router;