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
                console.log("here problem 1")
                return resp.status(403).json({message: "Пользователь не авторизован"});
            }

            let userData;
            try {
                userData = jwt.verify(token, secret);
            } catch (e) {
                return resp.status(403).json({message: "Пользователь не авторизован"});
            }

            let taskError = false;
            const task = await Task.findOne({_id: req.body.task_id}).catch(e => {
                taskError = true;
                return resp.status(404).json({message: "Задача не найдена"});
            })

            if(!taskError){
                const CA = await CourseAccount.findOne({user_id: userData.id, course_id: task?.course_id || req.params.id || req.body.course_id});

                if(!CA){
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

                if(!hasRole){
                    return resp.status(403).json({message: "Недостаточно прав"});
                }
                req.CA = CA;
                next();
            }

        }catch (e){
            console.log("here problem 2")
            return resp.status(403).json({message: "Что-то пошло не так"});
        }
    }
}