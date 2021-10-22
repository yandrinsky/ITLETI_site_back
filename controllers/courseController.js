import Course from "../models/Course.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
import Article from "../models/Article.js";
import Meeting from "../models/Meeting.js";
import Homework from "../models/Homework.js";
import CourseAccount from "../models/CourseAccount.js";
import Comment from "../models/Comment.js";
import jwt from "jsonwebtoken";
import {secret} from "../config.js";
import error from "../auxilary/error.js";

import {validationResult} from "express-validator";

import fs from "fs"
import path from "path"
import Grade from "../models/Grade.js";



const TEST = {
    user_id: "614fa662bb625c8903a438a4", //614fa662bb625c8903a438a4
    student_id: "614fa654bb625c8903a438a0",
}

function deleteImg(name){
    let result = false;
    const my_path = path.join(path.resolve(), "/assets/img/" + name)

    fs.stat(my_path, (err, stats) => {
        if (err) {
            return
        }
        fs.unlink(my_path, function (err) {
            if (err) return
            result = true
        });
    })
    return result;
}

function userData(req, resp){
    const token = req.headers.authorization;
    let userData;
    if(!token){
        return resp.status(403).json({message: "Пользователь не авторизован"});
    }

    try{
        userData = jwt.verify(token, secret);
        return userData;
    } catch (e){
        resp.status(403).json(error("Ошибка авторизации"))
        return null
    }
}

function getHomeworkType(homework){
    let type;
    if(homework) {
        if (homework.passed) {
            type = "PASSED"
        } else if (homework.checked) {
            type = "FAILED"
        } else {
            type = "NOT_CHECKED"
        }
        return type;
    } else {
        return null
    }
}

async function prepTeachersName(teachers){
    let teachersNames = [];
    for (let i = 0; i < teachers.length; i++) {
        let id = teachers[i]
        const CA = await CourseAccount.findOne({_id: id});
        if(CA){
            const teacher = await User.findOne({_id: CA.user_id})
            if(teacher) {
                teachersNames.push(teacher.name + " " + teacher.surname);
            }
        }
    }
    return teachersNames;
}

class courseController{
    constructor() {
        this.deleteImg = 1;
    }
    async get(req, resp){
        try{
            const token = req.headers.authorization;
            let userData
            //console.log("token is", !!token, token, "userData is", !!userData)
            if(token){
                try{
                    userData = jwt.verify(token, secret);
                } catch (e){

                }
            }
            const courses = await Course.find();
            let data = []

            for(let j = 0; j < courses.length; j++){
                let teachers;
                let doc = courses[j];


                teachers = await prepTeachersName(doc.teachers);

                let isMine = false;

                if(userData){
                    isMine = (await CourseAccount.findOne({user_id: userData.id, course_id: doc._id}))
                    isMine = !!isMine;
                }

                const {title, description, preview, status, join, _id} = doc;

                data.push( {
                    teachers,
                    title,
                    preview,
                    status,
                    description,
                    join,
                    isMine: isMine,
                    id: _id
                })
            }

            resp.json(data.length !== 0 ? data : null);
        } catch(e){
            console.log("error is ", e)
            resp.json(error(e)).status(400)
        }
    }

    async getCourseById(req, resp){
        try{
            const course = await Course.findOne({_id: req.params.id});
            let teachers;
            teachers = await prepTeachersName(course.teachers);
            const {_id, title, description, preview, articles, notifications, tasks, meetings} = course

            let meeting = await Meeting.findOne({_id: meetings[meetings.length - 1]});
            if(meetings.length > 0 && meeting){
                meeting = meeting.active ? meeting : null;
                if(meeting){
                    meeting = {
                        title: meeting.title,
                        content: meeting.content,
                        signup: meeting.students.includes(req.CA._id),
                        active: meeting.active,
                        date: meeting.date,
                    }
                }
            }

            resp.json(
                {
                    id: _id,
                    title,
                    description,
                    preview,
                    articles,
                    notifications,
                    tasks,
                    role: req.CA.role,
                    meeting: meeting ? meeting : null,
                }

            )
        } catch (e){
            resp.status(400);
        }
    }

    async getCourseTasks(req, resp){
        const id = req.body.course_id;
        try{
            const course = await Course.findOne({_id: id});
            const formedTasks = [];
            const closedTasks = [];
            for(let i = 0; i < course.tasks.length; i++){
                let task = await Task.findOne({_id: course.tasks[i]})
                if(task.status === "CLOSE") {
                    closedTasks.push(task)
                } else {
                    formedTasks.push(task);
                }
            }
            resp.json(
                {
                    tasks: [...formedTasks, ...closedTasks]
                }
            )
        } catch (e){
            resp.status(400);
        }
    }

    async registration(req, resp){
        try{
            const {title, description} = req.body;
            const user_id = TEST.user_id; //сменить на юзера из токена

            const course = await Course.create({title, description, preview: "logo_it_leti.jpg"}); //создаём курс
            //создаём аккаунт курса с ролью учителя
            const cAccount = await CourseAccount.create({course_id: course._id, user_id, role: "TEACHER"})
            const user = await User.findOne({_id: user_id})

            //Добавляем в курс id на аккаунт курса с ролью учителя
            await Course.updateOne({_id: course._id}, { teachers: [cAccount._id], authors: [cAccount._id] })

            //Добавляем в аккаунт создателя id аккаунта курса
            user.teaching.push(cAccount._id);
            let res = await User.updateOne({_id: user_id}, {teaching: user.teaching})
            resp.json("ok").status(200);
        } catch(e){
            console.log("error", e)
            resp.json(e.keyPattern?.title === 1 ? "Имя курса занято" : e).status(400)
        }
    }

    async setTask(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка при добавлении задачи", errors});
            }
            const {course_id, title, content} = req.body;
            const author_id = "614c97a97ab68cf71472a5ed" //тестовый id зареганого меня


            //находим курс
            const course = await Course.findOne({_id: course_id});
            if(course){
                //создаём таск
                const task = await Task.create({author_id, course_id, title, content});
                //Добовляем id нового task в массив task'ов
                course.tasks.push(task._id);

                //Обновляем курс
                await Course.updateOne({_id: course_id}, {tasks: course.tasks});
                resp.json("ok").status(200);
            } else {
                resp.json(error("Курс не найден")).status(400);
            }

        } catch(e){
            console.log("error", e)
        }
    }

    async getTask(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка получении задачи", errors});
            }
            let {task_id} = req.body; //сменить на const


            const user_id = userData(req, resp).id;
            if(user_id === null) return;


            const task = await Task.findOne({_id: task_id});

            if(!task){
                return resp.status(404).json({message: "Задача не найдена"});
            }

            //Такс доступен либо учителю в этом курсе, либо ученикам курса, либо модеру или админу

            if(await Course.findOne({_id: task.course_id})){ //Если такой курс есть
                const user = await User.findOne({_id: user_id});
                let hasAccess = false;


                //Учится ли user на курсе, к которому принадлежит task
                let CA = await CourseAccount.findOne({user_id: user._id, course_id: task.course_id})
                if(CA){
                    hasAccess = true;
                }

                //Ультра права доступа
                if(!hasAccess){
                    hasAccess = user.roles.includes("MODERATOR") || user.roles.includes("ADMIN")
                }

                if(hasAccess){
                    let ableToSend = false;
                    let homework = await Homework.findOne({task_id: task._id, course_account_id: CA._id});
                    let comments = [];

                    //Проверяем состояние домашки
                    if(homework && homework.checked && !homework.passed || !homework && task.status === "OPEN"){
                        ableToSend = true;
                    }

                    let type = getHomeworkType(homework);

                    if(!type){
                        type = task.status
                    }

                    if(homework && homework.comments.length !== 0){
                        for (let i = 0; i < homework.comments.length; i++) {
                            const comment = await Comment.findOne({_id: homework.comments[i]});
                            const CA = await CourseAccount.findOne({_id: comment.author_id});
                            const user = await User.findOne({_id: CA.user_id});
                            const name = user.name + " " + user.surname;
                            comments.push({
                                content: comment.content,
                                name,
                                type: comment.type,
                                date: comments.date,
                            })
                        }
                    }

                    const {_id, title, content, status} = task;
                    resp.json({id: _id, title, content,
                         status, homework: homework && homework.content ? homework.content : "",
                         ableToSend, type, comments}).status(200)
                } else {
                    resp.json(error("Вы не принадлежите к группе курса")).status(400);
                }
            } else {
                resp.json(error("Курс не существует")).status(400);
            }
        } catch(e){
            console.log("error", e)
        }
    }


    async getHomework(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка входных данных при получении ДЗ", errors});
            }
            const {course_id} = req.body;

            const course = await Course.findOne({_id: course_id});

            if(course.needToCheck.length === 0) {
                return resp.status(404).json({message: "Все дз проверены"});
            }

            const homework = await Homework.findOne({_id: course.needToCheck[0]});
            const task = await Task.findOne({_id: homework.task_id});
            const comments = await Comment.find({_id: {$in: homework.comments}})

            resp.json({
                homework: {
                    content: homework.content,
                    comments: comments?.map(comment => {
                        return {
                            type: comment.type,
                            content: comment.content,
                        }
                    }),
                    id: homework._id,

                },
                task: {
                    title: task.title,
                    content: task.content,
                },
                needToCheck: course.needToCheck.length,
            }).status(200);

        } catch (e){
            resp.status(404).json({message: "Все дз проверены"});
        }
    }

    async gradeHomework(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка оценки ДЗ", errors});
            }
            const {homework_id, course_id, status, comment} = req.body;

            const course = await Course.findOne({_id: course_id});

            if(course.needToCheck[0] === homework_id){
                course.needToCheck.splice(0, 1);
                await Course.updateOne({_id: course_id}, {needToCheck: course.needToCheck})
            } else {
                return resp.status(400).json({message: "Дз уже кем-то оценено"});
            }


            if(comment){
                const formedComment = await Comment.create({content: comment, type: "TEACHER", author_id: req.CA._id, date: new Date().getTime()});
                const hmw = await Homework.findOne({_id: homework_id});
                hmw.comments.push(formedComment._id);
                await Homework.updateOne({_id: homework_id}, {passed: status === "PASSED", checked: true, comments: hmw.comments});
            } else {
                await Homework.updateOne({_id: homework_id}, {passed: status === "PASSED", checked: true});
            }

            resp.status(200).json({message: "Ok"})
        } catch (e) {
            console.log("errors", e);
            resp.status(400).json({message: "Ошибка оценки дз", errors: e})
        }
    }

    async sendHomework(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Отправки ДЗ", errors});
            }
            const {task_id, content, comment} = req.body;


            const user_id = userData(req, resp).id;

            const task = await Task.findOne({_id: task_id});


            const CA = await CourseAccount.findOne({user_id: user_id, course_id: task.course_id});
            let formedComment;
            let homework;

            homework = await Homework.findOne({course_account_id: CA._id, task_id});


            if(comment){
                formedComment = await Comment.create({author_id: CA._id, type: CA.role, content: comment})
            }

            if(homework){
                if(comment) {
                    homework.comments.push(formedComment._id);
                }

                await Homework.updateOne({_id: homework._id}, {
                    checked: false,
                    passed: false,
                    tries: homework.tries + 1,
                    content: content,
                    comments:  homework.comments,
                });

            } else {
                homework = await Homework.create({course_account_id: CA._id, task_id, content, checked: false, tries: 1, comments: formedComment ? [formedComment._id] : []})
            }

            const course = await Course.findOne({_id: task.course_id});

            if(course.needToCheck){
                course.needToCheck.push(homework._id)
            } else {
                course.needToCheck = [homework._id]
            }

            if(CA.homeworks){
                CA.homeworks.push(homework._id)
            } else {
                CA.homeworks = [homework._id]
            }

            await Course.updateOne({_id: task.course_id}, {needToCheck: course.needToCheck})
            await CourseAccount.updateOne({_id: CA._id}, {homeworks: CA.homeworks})

            resp.json(homework);


        } catch (e){
            console.log("errors", e)
            resp.json({message: e}).status(400)
        }
    }

    async setMeeting(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка установки meeting", errors});
            }
            const {course_id, content, title} = req.body;


            const course = await Course.findOne({_id: course_id});
            if(!course.meetings){
                course.meetings = [];
            }

            //проверка, что последняя встреча остановлена или её нет, только тогда можно начать новую
            const lastMeeting = await Meeting.findOne({_id: course.meetings[course.meetings.length - 1]});

            if(lastMeeting && lastMeeting.active === false || !lastMeeting){
                const grade = await Grade.create({});
                const meeting = await Meeting.create({title, content, grade: grade._id, date: new Date().getTime()});

                course.meetings.push(meeting._id);
                await Course.updateOne({_id: course_id}, {meetings: course.meetings})

                resp.json({
                    meeting: {
                        title: meeting.title,
                        content: meeting.content,
                        signup: meeting.students.includes(req.CA._id),
                        active: meeting.active,
                        date: meeting.date,
                    }
                }).status(200);
            } else {
                resp.status(400).json({message: "Ошибка установки meeting: не завершена прошлая встреча"})
            }

        }catch (e){
            console.log(e)
            resp.status(400).json({message: "Ошибка установки meeting", e})
        }
    }

    async stopMeeting(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка остановки meeting", errors});
            }
            const {course_id} = req.body;
            const course = await Course.findOne({_id: course_id});

            await Meeting.updateOne({_id: course.meetings[course.meetings.length - 1]}, {active: false});
            const meeting = await Meeting.findOne({_id: course.meetings[course.meetings.length - 1]})

            resp.json({
                meeting: {
                    title: meeting.title,
                    content: meeting.content,
                    signup: meeting.students.includes(req.CA._id),
                    active: meeting.active,
                    date: meeting.date,
                }
            }).status(200);
        }catch (e){
            resp.status(400).json({message: "Ошибка остановки meeting", errors: e})
        }
    }

    async signupForMeeting(req, resp){
        const errors = validationResult(req);
        try{
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка отметки присутсвия", errors});
            }
            const {course_id} = req.body;

            const course = await Course.findOne({_id: course_id});
            const meeting = await Meeting.findOne({_id: course.meetings[course.meetings.length - 1]});

            if(meeting.active){
                if(!meeting.students.includes(req.CA._id)){
                    meeting.students.push(req.CA._id);
                    meeting.attendance += 1;
                    await Meeting.updateOne({_id: meeting._id}, {students: meeting.students, attendance: meeting.attendance});

                    return resp.json({
                        meeting: {
                            title: meeting.title,
                            content: meeting.content,
                            signup: true,
                            active: meeting.active,
                            date: meeting.date,
                        }
                    });
                } else {
                    return resp.status(400).json({message: "Ошибка отметки присутсвия: вы уже отметились"});
                }


            } else {
                return resp.status(400).json({message: "Ошибка отметки присутсвия: занятие уже завершилось"});
            }
        } catch (e){
            resp.status(400).json({message: "Ошибка отметки присутсвия", errors: e})
        }
    }

    async gradeMeeting(req, resp){
        const errors = validationResult(req);
        try{
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка отметки присутсвия", errors});
            }
            const {course_id, mark, comment} = req.body;

            const course = await Course.findOne({_id: course_id});
            const meeting = await Meeting.findOne({_id: course.meetings[course.meetings.length - 1]});
            const grade = await Grade.findOne({_id: meeting.grade});


            if(meeting && !meeting.active){
                if(!grade.accounts.includes(req.CA._id)){
                    grade.accounts.push(req.CA._id)
                    if(mark !== null){ //если пользователь НЕ отказался от опроса
                        grade[mark] += 1;
                        if(comment){
                            const newComment = await Comment.create({
                                author_id: null,
                                type: "STUDENT",
                                date: new Date().getTime(),
                                content: comment,
                            })
                            grade.comments.push(newComment._id);
                        }
                        await Grade.updateOne({_id: grade._id},
                            {
                                [mark]: grade[mark],
                                comments: grade.comments,
                                accounts: grade.accounts,
                            });
                    } else {
                        await Grade.updateOne({_id: grade._id},{ accounts: grade.accounts });
                    }
                    resp.json({message: "ok"}).status(200);
                } else {
                    return resp.status(400).json({message: "Ошибка оценки занятия: вы уже проголосовали"});
                }
            } else {
                return resp.status(400).json({message: "Ошибка оценки занятия: занятие еще не завершилось"});
            }
        } catch (e){
            resp.status(400).json({message: "Неизвестная ошибка оценки занятия", errors: e})
        }
    }

    async shouldGradeMeeting(req, resp){
        const errors = validationResult(req);
        try{
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка отметки присутсвия", errors});
            }
            const {course_id} = req.body;

            const course = await Course.findOne({_id: course_id});
            const meeting = await Meeting.findOne({_id: course.meetings[course.meetings.length - 1]});
            const grade = await Grade.findOne({_id: meeting.grade});


            if(meeting && !meeting.active){
                if(!grade.accounts.includes(req.CA._id) && meeting.students.includes(req.CA._id)){
                    resp.json({grade: {
                            title: meeting.title,
                            date: meeting.date,
                        }}).status(200);
                } else {
                    return resp.status(200).json({grade: null});
                }
            } else {
                return resp.status(400).json({grade: null});
            }
        } catch (e){
            resp.status(400).json({message: "Неизвестная ошибка запроса оценки занятия", errors: e})
        }

    }

    async joinCourse(req, resp){
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return resp.status(400).json({message: "Ошибка при присоединении к курсу", errors});
            }

            const token = req.headers.authorization;
            if(!token){
                return resp.status(403).json({message: "Пользователь не авторизован"});
            }
            let userData = jwt.verify(token, secret);
            const user_id = userData.id;

            const {course_id} = req.body;
            const CA = await CourseAccount.create({course_id, user_id})

            const course = await Course.find({_id: course_id});

            if(course.students){
                course.students.push(CA._id);
            } else {
                course.students = [CA._id]
            }

            await Course.updateOne({_id: course_id}, {students: course.students})

            const user = await User.findOne({_id: user_id})
            user.learning.push(CA._id)
            await User.updateOne({_id: user_id}, {learning: user.learning})

            resp.json("ok");

        }catch (e){
            resp.json({errors: e}).status(400);
        }
    }

    async deleteCourse(req, resp) {

        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return resp.status(400).json({message: "Ошибка при удалении", errors});
            }

            const {course_id} = req.body;
            const course = await Course.findOne({_id: course_id});


            //Удаляем изображение если оно не стадартное
            if (course.preview !== "logo_it_leti.jpg") {
                deleteImg(course.preview);
            }


            for (let i = 0; i < course.tasks.length; i++) {
                await Task.deleteOne({_id: course.tasks[i]})
            }

            for (let i = 0; i < course.notifications.length; i++) {
                await Notification.deleteOne({_id: course.notifications[i]})
            }

            for (let i = 0; i < course.articles.length; i++) {
                await Article.deleteOne({_id: course.articles[i]})
            }

            for (let i = 0; i < course.meetings.length; i++) {
                await Meeting.deleteOne({_id: course.meetings[i]})
            }

            for (let i = 0; i < course.students.length; i++) {

                const CA = await CourseAccount.findOne({_id: course.students[i]});
                //Удаляем все домашки и комментарии к ним
                for (let j = 0; j < CA.homeworks.length; j++) {
                    let hmw_id = CA.homeworks[j];
                    let hmw = await Homework.findOne({_id: hmw_id});
                    //Удаляем комментарии к работе
                    for (let k = 0; k < hmw?.comments.length; k++) {
                        await Comment.deleteOne({_id: hmw.comments[k]})
                    }
                    //Удаляем домашку
                    await Homework.deleteOne({_id: hmw})
                }

                const user = await User.findOne({_id: CA.user_id})
                user.learning.splice(user.learning.indexOf(CA._id), 1);
                await User.updateOne({_id: user._id}, {learning: user.learning})

                await CourseAccount.deleteOne({_id: course.students[i]})
            }

            for (let i = 0; i < course.teachers.length; i++) {
                const CA = await CourseAccount.findOne({_id: course.teachers[i]});
                if(CA){
                    const user = await User.findOne({_id: CA.user_id})
                    user.teaching.splice(user.learning.indexOf(CA._id), 1);
                    await User.updateOne({_id: user._id}, {teaching: user.teaching})

                    await CourseAccount.deleteOne({_id: course.teachers[i]})
                }

            }

            await Course.deleteOne({_id: course._id})


            resp.json("ok").status(200);

        } catch (e){
            console.log(e)
            resp.json(e).status(400);
        }
    }

    // async specFixMeeting(req, resp){
    //     try{
    //         await Meeting.syncIndexes();
    //         const meeting = await Meeting.findOne({_id: "616eeae75d04f5ed21a1215d"});
    //         const grade = await Grade.create({});
    //         meeting.grade = grade._id;
    //         await Meeting.updateOne({_id: meeting._id}, {grade});
    //         resp.json({message: "ok"});
    //     } catch (e) {
    //         console.log(e)
    //         resp.status(400).json({message: "error"})
    //     }
    //
    // }

}



export default new courseController();