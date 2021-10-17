import Router from "express";
import courseController from "../controllers/courseController.js";
import {check} from "express-validator";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import Course from "../models/Course.js";
import Task from "../models/Task.js";
import CourseAccount from "../models/CourseAccount.js";
import Homework from "../models/Homework.js";
import Comment from "../models/Comment.js";

const router = new Router();
import path from "path";
import User from "../models/User.js";
import courseRoleMiddleware from "../middleware/courseRoleMiddleware.js";



//Получить информацию по всем курса
router.get(
    '/',
    courseController.get
);
//Получить информацию по конкретному курсу
router.get(
    '/:id',
    [courseRoleMiddleware(["STUDENT", "TEACHER"])],
    courseController.getCourseById
);

router.post(
    '/getTasks',
    [
        check('course_id', "Не указан id курса").notEmpty(),
    ],
    courseController.getCourseTasks
);


router.post(
    '/getTask',
    [
        check('task_id', "Не указан id курса").notEmpty(),
        courseRoleMiddleware(["STUDENT", "TEACHER"]),
    ],
    courseController.getTask
);

//Регистрация курса
router.post(
    '/registration',
    [
        check('title', "Не указано имя курса").notEmpty(),
        check('description', "Не указано имя курса").notEmpty(),
    ],
    courseController.registration
);

//Регистрация задачи

router.post(
    '/setTask',
    [
        check('course_id', "Не указан id курса").notEmpty(),
        check('title', "Не указан заголовок задачи").notEmpty(),
        check('content', "Не указано описание задачи").notEmpty(),
        courseRoleMiddleware(["TEACHER"]),
    ],
    courseController.setTask
)


router.post(
    '/registrationFix',
    [roleMiddleware(["ADMIN"])],
    async (req, resp)=> {
        Course.syncIndexes();
        User.syncIndexes();

        resp.json("fixed");
    }
);

router.post(
    '/removeAll',
    // [roleMiddleware(["ADMIN"])],
    async (req, resp) => {
        try {
            //Удалить все CourseAccount, Tasks,
            //Удалить у users из teaching и learning
            Course.remove({}, ()=>{})
            Task.remove({}, ()=>{})
            CourseAccount.remove({}, ()=>{});
            Homework.remove({}, ()=>{});
            Comment.remove({}, ()=>{});
            User.remove({}, ()=> {});
            resp.json("all removed")
        } catch (e){
            resp.json(e).status(400)
        }

    }
)

router.post(
    '/removeOne',
    [
        // roleMiddleware(["ADMIN"]),
        check('course_id', 'Не указан id курса').notEmpty()
    ],
    courseController.deleteCourse,

)

router.post(
    '/sendHomework',
    [
        courseRoleMiddleware(["STUDENT", "TEACHER"])
    ],
    [
        check('task_id', 'Не указан id задачи').notEmpty(),
        check('content', 'Ответ не может быть пустым').notEmpty(),
    ],
    courseController.sendHomework,

)

router.post(
    '/joinCourse',
    [
        check('course_id', 'Не указан id курса').notEmpty()
    ],
    courseController.joinCourse,
)

router.post(
    '/getHomework',
    [courseRoleMiddleware(["TEACHER"])],
    courseController.getHomework,
)

router.post(
    '/gradeHomework',
    [
        courseRoleMiddleware(["TEACHER"]),
        check('status', '').notEmpty(),
        check('homework_id', '').notEmpty(),
        check('course_id', '').notEmpty(),
    ],
    courseController.gradeHomework,
)

// router.post('/users/changeRole',
//     [authMiddleware, roleMiddleware(["ADMIN"])],
//     authController.changeRole
// );
//
// router.post('/login', authController.login);
// router.get('/users', [authMiddleware, roleMiddleware(["ADMIN"])], authController.getUsers);
//
// router.post('/markdown', (req, resp) => {
//     console.log(req.body);
//     resp.json({html: markdown.toHTML(req.body.message)});
// });




export default router;