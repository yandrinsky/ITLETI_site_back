import jwt from "jsonwebtoken";
import {secret} from "../config.js";
import CourseAccount from "../models/CourseAccount.js";
import Task from "../models/Task.js";


export default (roles) => {
    return async (req, resp, next) => {
        if(req.method === "OPTIONS"){
            next();
        }
        try {
            const token = req.headers.authorization;
            if(token === null){
                return resp.status(403).json({message: "Пользователь не авторизован", code: 1});
            }

            let userData;
            try {
                userData = jwt.verify(token, secret);
            } catch (e) {
                return resp.status(403).json({message: "Пользователь не авторизован", code: 1});
            }

            let taskError = false;
            const task = await Task.findOne({_id: req.body.task_id})
                .catch(e => {
                    taskError = true;
                    //return resp.status(404).json({message: "Задача не найдена"});
                })



            //Добавляем инфу по юзеру
            if(!req.hasOwnProperty("user")){
                req.user = userData;
            }

            //Надо фиксить чо тут вообще происходит. С чего вдруг определение роли курса идёт по задаче...
            if(!taskError){

                const CA = await CourseAccount.findOne({user_id: userData.id, course_id: task?.course_id || req.params.id || req.body.course_id});

                if(!CA){
                    if(req.body.task_id && !task){
                        return resp.status(404).json({message: "Задача не найдена"});
                    }

                    return resp.status(403).json({message: "Вы не участник этого курса"});
                }
                if(CA.status === "EXPELLED"){
                    return resp.status(403).json({message: "Вы отчислены"});
                }

                //console.log("info", CA, userData.id, req.body)
                let hasRole = false;

                if(roles.includes(CA.role)){
                    hasRole = true;
                }
                if(req.user.roles.includes("ADMIN")){
                    hasRole = true;
                    CA.role = "TEACHER";
                }

                if(!hasRole){
                    return resp.status(403).json({message: "Недостаточно прав"});
                }
                req.CA = CA;
                next();
            }

        }catch (e){
            return resp.status(403).json({message: "Что-то пошло не так"});
        }
    }
}