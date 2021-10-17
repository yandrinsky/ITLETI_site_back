import Router from "express";
import authController from "../controllers/authController.js";
import {check} from "express-validator";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {markdown} from "markdown"
import Role from "../models/Role.js";

const router = new Router();

router.post(
    '/registration',
    [
        check('username', 'Имя пользователя не может быть пустым').notEmpty(),
        check('password', 'Пароль должен быть более 4 но менее 10 символов').isLength({max: 30, min: 4}),
        check('name', 'Имя не может быть пустым').notEmpty(),
        check('surname', 'Фамилия не может быть пустой').notEmpty(),
        check('group', 'Группа не может быть пустой').notEmpty(),
        check('vk', 'Вк не может быть пустым').notEmpty(),
    ],
    authController.registration
);

router.post(
    '/validToken',
    [
        check('token').notEmpty(),
    ],
    authController.validToken,

)
router.post('/users/changeRole',
    [authMiddleware, roleMiddleware(["ADMIN"])],
    authController.changeRole
);

router.post('/login', authController.login);

router.get('/users', [authMiddleware, roleMiddleware(["ADMIN"])], authController.getUsers);

router.post('/markdown', (req, resp) => {
    console.log(req.body);
    resp.json({html: markdown.toHTML(req.body.message)});
});


router.post("/roles", (req, resp)=> {
    try{
        Role.create({value: "USER"});
        resp.status(200).json("ok")
    } catch (e){
        resp.status(400).json(e)
    }

})



export default router;