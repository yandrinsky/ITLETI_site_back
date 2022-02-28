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
import Grade from "../models/Grade.js";



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

router.get(
    '/about/:id',
    courseController.getAboutCourseById
);

router.post(
    '/getTasks',
    [
        check('course_id', "Не указан id курса").notEmpty(),
    ],
    courseController.getCourseTasks
);

router.post(
    '/getMeetings',
    [
        [courseRoleMiddleware(["STUDENT", "TEACHER"])],
        check('course_id', "Не указан id курса").notEmpty(),
    ],
    courseController.getCourseMeetings
);

router.post(
    '/getMeeting',
    [
        [courseRoleMiddleware(["STUDENT", "TEACHER"])],
        check('meeting_id', "Не указан id курса").notEmpty(),
    ],
    courseController.getMeeting
);

router.post(
    '/getTask',
    [
        courseRoleMiddleware(["STUDENT", "TEACHER"]),
        check('task_id', "Не указан id курса").notEmpty(),
    ],
    courseController.getTask
);



//Регистрация курса
router.post(
    '/registration',
    [
        roleMiddleware(["ADMIN"]),
    ],
    [
        check('title', "Не указано имя курса").notEmpty(),
        check('description', "Не указано имя курса").notEmpty(),
        check('conversation_link', "Не указана ссылка на беседу").notEmpty(),
        check('about', "Не указано описание курса").notEmpty(),
        check('preview', "Не указано название preview").notEmpty(),
    ],
    courseController.registration
);

//Регистрация задачи

router.post(
    '/setTask',
    [
        courseRoleMiddleware(["TEACHER"])
    ],
    [
        check('course_id', "Не указан id курса").notEmpty(),
        check('title', "Не указан заголовок задачи").notEmpty(),
        check('content', "Не указано описание задачи").notEmpty(),
        check('status', "Не указан статус задачи").notEmpty(),
    ],
    courseController.setTask
)

router.post(
    '/deleteTask',
    [
        check('task_id', "Не указан id задачи").notEmpty(),
        courseRoleMiddleware(["TEACHER"]),
    ],
    courseController.deleteTask
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
        check('course_id', 'Не указан id курса').notEmpty(),
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

router.post(
    '/setMeeting',
    [
        courseRoleMiddleware(["TEACHER"]),
        check('course_id', '').notEmpty(),
        check('title', '').notEmpty(),
        check('content', '').notEmpty(),
    ],
    courseController.setMeeting,
)

router.post(
    '/stopMeeting',
    [
        courseRoleMiddleware(["TEACHER"]),
        check('course_id', '').notEmpty(),
    ],
    courseController.stopMeeting,
)

router.post(
    '/signupForMeeting',
    [
        courseRoleMiddleware(["STUDENT", "TEACHER"]),
        check('course_id', '').notEmpty(),
    ],
    courseController.signupForMeeting,
)



router.post(
    '/registrationFix',
    [roleMiddleware(["ADMIN"])],
    async (req, resp)=> {
        // Course.syncIndexes();
        // User.syncIndexes();
        Grade.syncIndexes();

        resp.json("fixed");
    }
);

router.post(
    '/shouldGradeMeeting',
    [
        courseRoleMiddleware(["STUDENT", "TEACHER"]),
        check("course_id", "").notEmpty(),
    ],
    courseController.shouldGradeMeeting,
)


router.post(
    '/gradeMeeting',
    [
        courseRoleMiddleware(["STUDENT"]),
        check("course_id", "").notEmpty(),
    ],
    courseController.gradeMeeting,
)

// router.post(
//     '/checkDoubleAcc',
//     courseController.checkDoubleAcc,
// )
// router.post(
//     "/setTeacher",
//     courseController.setTeacher,
// )
//
// router.post(
//     '/fixStudents',
//     courseController.fixStudents,
// )




// router.post('/users/changeRole',
//     [authMiddleware, roleMiddleware(["ADMIN"])],
//     authController.changeRole
// );

// router.get('/users', [authMiddleware, roleMiddleware(["ADMIN"])], authController.getUsers);


// router.post(
//     '/removeOne',
//     [
//         // roleMiddleware(["ADMIN"]),
//         check('course_id', 'Не указан id курса').notEmpty()
//     ],
//     courseController.deleteCourse,
//
// )

// router.post(
//     '/removeAll',
//     [roleMiddleware(["ADMIN"])],
//     async (req, resp) => {
//         try {
//             //Удалить все CourseAccount, Tasks,
//             //Удалить у users из teaching и learning
//             Course.remove({}, ()=>{})
//             Task.remove({}, ()=>{})
//             CourseAccount.remove({}, ()=>{});
//             Homework.remove({}, ()=>{});
//             Comment.remove({}, ()=>{});
//             User.remove({}, ()=> {});
//             resp.json("all removed")
//         } catch (e){
//             resp.json(e).status(400)
//         }
//
//     }
// )





export default router;