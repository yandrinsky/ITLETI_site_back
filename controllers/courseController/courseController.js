import Course from "../../models/Course.js";
import User from "../../models/User.js";
import Task from "../../models/Task.js";
import Notification from "../../notifications/Notification.js";
import Article from "../../models/Article.js";
import Meeting from "../../models/Meeting.js";
import Homework from "../../models/Homework.js";
import CourseAccount from "../../models/CourseAccount.js";
import Comment from "../../models/Comment.js";
import jwt from "jsonwebtoken";
import {secret} from "../../config.js";
import error from "../../auxilary/error.js";

import {validationResult} from "express-validator";

import fs from "fs"
import path from "path"
import Grade from "../../models/Grade.js";
import {sendMessage} from "../../VK/bot/bot.js";
import {getMeeting} from "./funtions/meeting/getMeeting.js";
import {getCourseStudentsAttendance} from "./funtions/statistics/studentsAttendance.js";



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
        return resp.status(403).json(error("Пользователь не авторизован", 1));
    }

    try{
        userData = jwt.verify(token, secret);
        return userData;
    } catch (e){
        return resp.status(403).json(error("Ошибка авторизации", 1));
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
                let data = {
                    vk_link: "https://vk.com/id" + teacher.vk_id,
                    name: teacher.name + " " + teacher.surname,
                }
                teachersNames.push(data);
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
            let uData;
            if(token){
                try{
                    uData = jwt.verify(token, secret);
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

                if(uData){
                    isMine = (await CourseAccount.findOne({user_id: uData.id, course_id: doc._id}))
                    isMine = !!isMine;
                }

                const {title, description, preview, status, join, _id} = doc;

                data.push({
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

    async getAboutCourseById(req, resp){
        try{
            const token = req.headers.authorization;
            let userData
            let isMine = false;

            if(token){
                try{
                    userData = jwt.verify(token, secret);

                    if(userData){
                        isMine = await CourseAccount.findOne({user_id: userData.id, course_id: req.params.id})
                        isMine = !!isMine;
                    }
                } catch (e){

                }
            }

            const course = await Course.findOne({_id: req.params.id});
            if(course){
                let teachers;
                teachers = await prepTeachersName(course.teachers);
                const {_id, title, description, preview, about, join} = course

                resp.json(
                    {
                        id: _id,
                        title,
                        description,
                        about,
                        preview,
                        teachers,
                        isMine,
                        join,
                    }
                )
            } else {
                resp.json(error("Курс не найден")).status(400);
            }

        } catch (e){
            resp.status(400);
        }
    }

    async getCourseById(req, resp){
        try{
            const course = await Course.findOne({_id: req.params.id});
            let teachers;
            teachers = await prepTeachersName(course.teachers);
            const {_id, title, description, preview, articles, notifications, tasks, meetings, about} = course

            //let meeting = await Meeting.findOne({_id: meetings[meetings.length - 1]});

            let meeting = await getMeeting({_id: meetings[meetings.length - 1], CA: req.CA});
            if(meetings.length > 0 && meeting){
                meeting = meeting.active ? meeting : null;
                // if(meeting){
                //     meeting = {
                //         title: meeting.title,
                //         content: meeting.content,
                //         signup: meeting.students.includes(req.CA._id),
                //         active: meeting.active,
                //         date: meeting.date,
                //         id: meeting._id,
                //         link: meeting.link,
                //         CQ: meeting.CQ,
                //         CQ_title: meeting.CQ_title,
                //         CQ_answer: req.CA.role === "TEACHER" ? meeting.CQ_answer : null,
                //     }
                // }
            }

            let studentsCount;
            let needToCheck;
            if(req.CA.role === "TEACHER"){
                studentsCount = course.students.length;
                needToCheck = course.needToCheck.length;
            }

            resp.json(
                {
                    id: _id,
                    title,
                    description,
                    about,
                    preview,
                    articles,
                    tasks,
                    role: req.CA.role,
                    meeting: meeting ? meeting : null,
                    teachers,
                    studentsCount,
                    needToCheck,
                }

            )
        } catch (e){
            resp.json("Неизвестная ошибка получения курса", 0).status(400);
        }
    }

    async getCourseTasks(req, resp){
        const id = req.body.course_id;
        try{
            const tasks = await Task.find({course_id: id});
            resp.json({tasks})
        } catch (e){
            console.log("getCourseTasks error", e);
            resp.json("Неизвестная ошибка получения задач курса", 0).status(400);
        }
    }

    async getCourseMeetings(req, resp){
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return resp.status(400).json({message: "Ошибка входных данных при получении ДЗ", errors});
        }
        try{
            const {course_id} = req.body;
            const course = await Course.findOne({_id: course_id});
            let meetings = await Meeting.find({_id: course.meetings});
            meetings = meetings.map(item => {
                return {
                    id: item._id,
                    title: item.title,
                    date: item.date,
                }
            })

            resp.json(meetings).status(200);

        } catch (e){
            resp.json(error("Неизвестная ошибка загрузки meetings"));
        }
    }

    async getMeeting(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка при получении задачи: не переданы необходимые параметры", errors});
            }
            const {meeting_id} = req.body;

            const meeting = await Meeting.findOne({_id: meeting_id});
            if(meeting){
                let data = {
                    attendance: meeting.attendance,
                    date: meeting.date,
                    title: meeting.title,
                    content: meeting.content,
                    grade: 0,
                };
                const grade = await Grade.findOne({_id: meeting.grade});
                if(grade){
                    let avr = (1 * grade["1"] + 2 * grade["2"] + 3 * grade["3"] + 4 * grade["4"] + 5 * grade["5"]) / (grade["1"] + grade["2"] + grade["3"] + grade["4"] + grade["5"]);
                    if(String(avr).includes(".")){ //Округляем до 1 знака после запятой
                        avr = Number(String(avr).split(".")[0] + "." + String(avr).split(".")[1].slice(0, 1));
                    }
                    data.grade = avr;
                    if(avr){
                        data.marks = {
                            "5": grade["5"],
                            "4": grade["4"],
                            "3": grade["3"],
                            "2": grade["2"],
                            "1": grade["1"],
                        }
                    }
                    data.comments = await Comment.find({_id: grade.comments});
                }

                resp.json(data).status(200);

            } else {
                resp.json("Встреча не найдена").status(400);
            }
        } catch(e){
            console.log("error", e)
        }
    }

    async getMeetingAttendance(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка запросе посещаемости курса - не переданы необходимы параметры", errors});
            }
            const {meeting_id} = req.body;

            const meeting = await Meeting.findOne({_id: meeting_id});

            if(meeting){
                let CAS = await CourseAccount.find({_id: meeting.students});
                let users = await User.find({_id: CAS.map(item => item.user_id)});
                let data = users.map(user => {
                    const {name, surname, group, vk_id} = user;
                    return {name, surname, group, vk_id}
                })
                resp.json(data).status(200);

            } else {
                resp.json("Занятие не найдено").status(400);
            }
        } catch(e){
            console.log("error", e)
        }
    }



    async registration(req, resp){
        try{
            const {title, description, conversation_link, about, preview} = req.body;
            const user_id = TEST.user_id; //сменить на юзера из токена

            const course = await Course.create({title, description, conversation_link, about, preview}); //создаём курс
            //создаём аккаунт курса с ролью учителя
            const cAccount = await CourseAccount.create({course_id: course._id, user_id, role: "TEACHER"})
            const user = await User.findOne({_id: user_id})

            //Добавляем в курс id на аккаунт курса с ролью учителя
            await Course.updateOne({_id: course._id}, { teachers: [cAccount._id], authors: [cAccount._id] })

            //Добавляем в аккаунт создателя id аккаунта курса
            user.teaching.push(cAccount._id);
            await User.updateOne({_id: user_id}, {teaching: user.teaching});

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
                console.log("req body", req.body);
                return resp.status(400).json({message: "Ошибка при добавлении задачи", errors});
            }
            const {course_id, title, content, lang, type, contentType, isFrame, frameOption, resource, status, task_id} = req.body;
            const author_id = "614c97a97ab68cf71472a5ed" //тестовый id зареганого меня

            //находим курс
            const course = await Course.findOne({_id: course_id});
            if(course){
                let task = await Task.findOne({_id: task_id});
                //Проверяем, нужно обновить задачу или добавить новую
                if(task) {
                    await Task.updateOne({_id: task_id},
                        {title, content, status, lang, type, contentType, frame: isFrame, resource, frameOption})
                    resp.json({message: "ok"})
                } else {
                    //создаём таск
                    task = await Task.create({
                        author_id, course_id, title, content, status, lang, type, contentType, resource, frame: isFrame, frameOption
                    });
                    //Добовляем id нового task в массив task'ов
                    course.tasks.push(task._id);

                    //Делаем уведомление
                    await Notification.newTask(course_id, task._id);
                    //Обновляем курс
                    await Course.updateOne({_id: course_id}, {tasks: course.tasks});
                    resp.json("ok").status(200);
                }
            } else {
                resp.json(error("Курс не найден")).status(400);
            }

        } catch(e){
            console.log("error", e)
            resp.json(error("Неизвестная ошибка создания новой задачи", 0)).status(400);
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


                    //let type = getHomeworkType(homework);
                    //let status = getHomeworkType(homework);
                    let status = task.status;
                    let homeworkStatus = getHomeworkType(homework);


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

                    const {_id, title, content, type, contentType, lang, resource, frameOption, frame} = task;
                    resp.json(
                        {id: _id, title, content,
                             status, homework: homework && homework.content ? homework.content : "",
                             ableToSend, type, comments, contentType, lang, resource, frameOption, frame, homeworkStatus
                        }).status(200)
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

    async deleteTask(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка при добавлении задачи", errors});
            }


            const {task_id} = req.body;

            //Находим задачу
            const task = await Task.findOne({_id: task_id});
            if(!task){
                resp.json(error("Задача не найдена")).status(400);
                return;
            }
            const homeworks = await Homework.find({task_id: task_id});

            //находим курс
            const course = await Course.findOne({_id: task.course_id});
            if(course){
                course.tasks.splice(course.tasks.indexOf(task_id), 1); //Удаляем задачу из курса
                //Удаляем все домашки связанные с задачей из курса
                homeworks.forEach(hmw => {
                    let index = course.needToCheck.indexOf(hmw._id);
                    if(index !== -1){
                        course.needToCheck.splice(index, 1);
                    }
                })


                //Обновляем курс
                await course.update({tasks: course.tasks, needToCheck: course.needToCheck});
            }
            //Удаляем домашки
            homeworks.forEach(hmw => {
                hmw.delete();
            })
            //Удаляем задачу
            task.delete();


            // if(course){
            //
            //     //Проверяем, нужно обновить задачу или добавить новую
            //     if(task) {
            //         await Task.updateOne({_id: task_id},
            //             {title, content, status, lang, type, contentType, frame: isFrame, resource, frameOption})
            //         resp.json({message: "ok"})
            //     } else {
            //         //создаём таск
            //         task = await Task.create({
            //             author_id, course_id, title, content, status, lang, type, contentType, resource, frame: isFrame, frameOption
            //         });
            //         //Добовляем id нового task в массив task'ов
            //         course.tasks.push(task._id);
            //
            //         //Обновляем курс
            //         await Course.updateOne({_id: course_id}, {tasks: course.tasks});
            //         resp.json("ok").status(200);
            //     }
            // } else {
            //     resp.json(error("Курс не найден")).status(400);
            // }
            resp.json("ok").status(200);
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
                    frame: task.frame,
                    frameOption: task.frameOption,
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
            Notification.checkHomework(homework_id, status === "PASSED")
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
                homework = await Homework.create({course_account_id: CA._id, task_id, date: new Date().getTime(), content, checked: false, tries: 1, comments: formedComment ? [formedComment._id] : []})
            }

            const course = await Course.findOne({_id: task.course_id});

            if(course.needToCheck){
                course.needToCheck.push(homework._id)
            } else {
                course.needToCheck = [homework._id]
            }

            if(CA.homeworks){
                if(!CA.homeworks.includes(homework._id)){
                    CA.homeworks.push(homework._id)
                }
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
            const {course_id, content, title, CQ, CQ_title, CQ_answer, link} = req.body;
            const course = await Course.findOne({_id: course_id});
            if(!course.meetings){
                course.meetings = [];
            }

            //проверка, что последняя встреча остановлена или её нет, только тогда можно начать новую
            const lastMeeting = await Meeting.findOne({_id: course.meetings[course.meetings.length - 1]});

            if(lastMeeting && lastMeeting.active === false || !lastMeeting){
                const grade = await Grade.create({});
                const meeting = await Meeting.create({title, content, grade: grade._id, date: new Date().getTime(), CQ, CQ_title, CQ_answer: CQ_answer.toLowerCase(), link});

                course.meetings.push(meeting._id);
                await Course.updateOne({_id: course_id}, {meetings: course.meetings})
                Notification.startMeeting(course_id, meeting._id);
                resp.json({
                    meeting: {
                        title: meeting.title,
                        content: meeting.content,
                        signup: meeting.students.includes(req.CA._id),
                        active: meeting.active,
                        date: meeting.date,
                        CQ: meeting.CQ,
                        link: meeting.link,
                        CQ_title: meeting.CQ_title,
                        CQ_answer: meeting.CQ_answer,
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
            const {course_id, answer} = req.body;

            const course = await Course.findOne({_id: course_id});
            const meeting = await Meeting.findOne({_id: course.meetings[course.meetings.length - 1]});

            if(meeting.active){
                if(!meeting.students.includes(req.CA._id)){
                    if(meeting.CQ && meeting.CQ_answer !== answer.toLowerCase()){
                        return resp.status(400).json(error("Ответ неверный", 41))
                    }

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
            //console.log("req.CA._id", req.CA._id);
            if(meeting && !meeting.active){
                const grade = await Grade.findOne({_id: meeting.grade});
                if(!grade.accounts.includes(req.CA._id) && meeting.students.includes(req.CA._id) && !course.teachers.includes(req.CA._id)){
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
            console.log("shouldGradeMeeting error", e);
            resp.status(400).json({message: "Неизвестная ошибка запроса оценки занятия", errors: e})
        }

    }

    async getCourseStudentsAttendance(req, resp){
        try{
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return resp.status(400).json({message: "Ошибка при получении аргументов фунции getCourseStudentsAttendance", errors});
            }
            const res = await getCourseStudentsAttendance({course_id: req.body.course_id});
            resp.json(res).status(200);
        } catch (e){
            console.log(e);
            resp.json(error("Ошибка при получении статистики о посещаемости курса")).status(400);
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

            const CA = await CourseAccount.findOne({user_id, course_id});
            //if(!CA)
            if(1){
                const CA = await CourseAccount.create({course_id, user_id})

                const course = await Course.findOne({_id: course_id});

                if(course.students){
                    course.students.push(CA._id);
                } else {
                    course.students = [CA._id]
                }

                await Course.updateOne({_id: course_id}, {students: course.students})

                const user = await User.findOne({_id: user_id})
                user.learning.push(CA._id)
                await User.updateOne({_id: user_id}, {learning: user.learning})


                let message = await createJoinCourseMessage(course);
                await sendMessage(message, userData.vk_id);
                resp.json("ok");
            } else {
                resp.json(error("Вы уже зарегистрированы на курсе")).status(400);
            }

        }catch (e){
            resp.json({errors: e}).status(400);
        }
    }

    async fixStudents(req, resp){
        await Course.syncIndexes();
        const courses = await Course.find();
        for (let i = 0; i < courses.length; i++) {
            let course = courses[i];
            course.students = course.students.map(item => item instanceof Array ? item[0] : item);
            await course.update({students: course.students});
        }
        resp.json("ok").status(200);
    }

    async checkDoubleAcc(req, resp){
        try {
            let duplicate = 0;
            let duplicateId = [];
            let users = await User.find();

            for (let i = 0; i < users.length; i++) {
                let user = users[i];
                let learning = user.learning;
                //console.log("learning", learning);
                let CAS = await CourseAccount.find({_id: learning});
                let was = [];
                let userDuplicate = 0;
                for (let j = 0; j < CAS.length; j++) {
                    let CA = CAS[j];
                    //console.log("CA.course_id", CA.course_id);
                    if(!was.includes(CA.course_id)){
                        was.push(CA.course_id);
                    } else {
                        duplicate += 1;
                        userDuplicate += 1;
                        duplicateId.push(CA._id);
                    }
                }
            }

            for (let i = 0; i < duplicateId.length; i++) {
                if(!await deleteCourseAccount(duplicateId[i])){
                    resp.json(error("Ошибка при удалении CA: " + duplicateId[i])).status(400);
                    return;
                }
            }
            resp.json({duplicate, duplicateId}).status(200);
        } catch (e){
            resp.json(error(e)).status(400)
        }
    }

    async deleteCourseAccount(){
        const errors = validationResult(req);
        try{
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка отметки присутсвия", errors});
            }
            const {CA_id} = req.body;
            let res = await deleteCourseAccount(CA_id)
            reps.json(res).status(200);

        } catch (e){
            console.log("deleteCourseAccount error", e);
            resp.status(400).json({message: "Неизвестная ошибка при удалении аккаунта", errors: e})
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

    async setTeacher(req, resp){
        try{
            const {course_id, vk_id, user_id} = req.body;
            let course = await Course.findOne({_id: course_id});

            if(course){
                let user;
                if(user_id){
                    user = await User.findOne({_id: user_id});
                } else if(vk_id){
                    user = await User.findOne({vk_id});
                }


                if(user){
                    let CA = await CourseAccount.findOne({user_id: user._id, course_id});
                    if(CA){
                        user.teaching.push(course._id);
                        course.teachers.push(CA._id);

                        await user.update({teaching: user.teaching});
                        await CA.update({role: "TEACHER"});
                        await course.update({teachers: course.teachers});

                        resp.json("ok").status(200);
                    } else {
                        resp.json(error("Пользователь не зарегистрирован на курсе")).status(400);
                    }
                } else {
                    resp.json(error("Пользователь не найден")).status(400);
                }
            } else {
                resp.json(error("Курс не найден")).status(400);
            }


        } catch (e){
            console.log(e);
            resp.json(e).status(400);
        }
    }

    async coursesStats(req, resp){
        try{
            const {course_id, vk_id, user_id} = req.body;
            let courses = await Course.find({});
            let data = {};

            for (let i = 0; i < courses.length; i++) {
                let course = courses[i];
                //Счётчик домах;
                let hmwCount = 0;
                for (let j = 0; j < course.tasks.length; j++) {
                    hmwCount += await Homework.find({task_id: course.tasks[j]}).count();
                }

                let courseData = {
                    title: course.title,
                    meetings: [],
                    meetingsCount: 0,
                    tasks: course.tasks.length,
                    homeworks: hmwCount,
                    students: course.students.length,

                }

                //Подробно по занятиям
                let meetings = await Meeting.find({_id: course.meetings});
                for (let j = 0; j < meetings.length; j++) {
                    let meeting = meetings[j];
                    let grade = await Grade.findOne({_id: meeting.grade});
                    let avr = null;
                    if(grade){
                        avr = (1 * grade["1"] + 2 * grade["2"] + 3 * grade["3"] + 4 * grade["4"] + 5 * grade["5"]) / (grade["1"] + grade["2"] + grade["3"] + grade["4"] + grade["5"]);
                    }

                    let meetingData = {
                        title: meeting.title,
                        date: meeting.date,
                        attendance: meeting.attendance,
                        avr,
                    }
                    courseData.meetings.push(meetingData);

                }
                courseData.meetingsCount = meetings.length;
                data[courseData.title] = courseData;

            }
            resp.json(data).status(200);


        } catch (e){
            console.log(e);
            resp.json(e).status(400);
        }
    }

    async courseStats(req, resp){
        try{
            const {course_id, vk_id, user_id} = req.body;
            let course = await Course.findOne({_id: course_id});


            let courseData = {
                title: course.title,
                meetings: [],
                tasks: [],
                totalMeetings: 0,
                totalAvrGrade: undefined,
                totalTasks: undefined,
                totalHomeworks: undefined,
                students: course.students.length,
            }

            //Счётчик домах;
            let hmwCount = 0;
            let tasks = await Task.find({course_id});
            courseData.totalTasks = tasks.length;
            for (let j = 0; j < tasks.length; j++) {
                let curTask = tasks[j];
                let curHmw = await Homework.find({task_id: curTask._id});
                let passedCount = 0;
                let failedCount = 0;
                let uncheckedCount = 0;
                let firstTimePassed = 0;
                curHmw.forEach(item => {
                    if(item.checked === true && item.passed === true){
                        passedCount += 1;
                        if(item.tries === 1){
                            firstTimePassed += 1;
                        }
                    } else if(item.checked === true && item.passed === false){
                        failedCount += 1;
                    } else {
                        uncheckedCount += 1;
                    }
                })

                hmwCount += curHmw.length;
                courseData.tasks.push({
                    title: curTask.title,
                    total: curHmw.length,
                    passedCount,
                    failedCount,
                    uncheckedCount,
                    firstTimePassed,
                })
            }

            courseData.totalHomeworks = hmwCount;

            //Подробно по занятиям
            let meetings = await Meeting.find({_id: course.meetings});
            let avrs = []
            for (let j = 0; j < meetings.length; j++) {
                let meeting = meetings[j];
                let grade = await Grade.findOne({_id: meeting.grade});
                let avr = null;
                let marks = null;
                if(grade){
                    avr = (1 * grade["1"] + 2 * grade["2"] + 3 * grade["3"] + 4 * grade["4"] + 5 * grade["5"]) / (grade["1"] + grade["2"] + grade["3"] + grade["4"] + grade["5"]);
                    if(avr){
                        avrs.push(avr);
                    }
                    marks = {
                        "5": grade["5"],
                        "4": grade["4"],
                        "3": grade["3"],
                        "2": grade["2"],
                        "1": grade["1"],
                    }
                }

                let meetingData = {
                    title: meeting.title,
                    date: meeting.date,
                    attendance: meeting.attendance,
                    marks,
                    avr,
                    id: meeting._id,
                }
                courseData.meetings.push(meetingData);

            }
            courseData.totalAvrGrade = avrs.reduce((a, b) => a + b) / avrs.length;
            courseData.totalMeetings = meetings.length;
            resp.json({stats: courseData}).status(200);

        } catch (e){
            console.log(e);
            resp.json(e).status(400);
        }
    }
}
//Добавить удаление комменатриев, домашек
async function deleteCourseAccount(CA_id){
    let CA = await CourseAccount.findOne({_id: CA_id});
    if(CA){
        let user = await User.findOne({_id: CA.user_id});
        let course = await Course.findOne({_id: CA.course_id});
        let homeworks = await Homework.find({course_account_id: CA_id});
        let comments = await Comment.find({author_id: CA_id});

        for (let i = 0; i < comments.length; i++) { //Удаляем комменатарии
            await comments[i].delete();
        }

        if(course){
            let courseStudentsCaIndex = course.students.indexOf(CA_id);
            let courseTeachersCaIndex = course.teachers.indexOf(CA_id);

            if(courseStudentsCaIndex !== -1) { //Удялем у курса из students CA
                course.students.splice(courseStudentsCaIndex, 1);
                await course.update({students: course.students});
            }
            if(courseTeachersCaIndex !== -1) { //Удялем у курса из teachers CA
                course.teachers.splice(courseTeachersCaIndex, 1);
                await course.update({teachers: course.teachers});
            }

            for (let i = 0; i < homeworks.length; i++) { //Удаляем домашки
                let hmwIndex = course.needToCheck.indexOf(homeworks[i]._id);
                if(hmwIndex !== -1){ //Удаляем у курса в needToCheck домашку
                    course.needToCheck.splice(hmwIndex, 1);
                }
                await homeworks[i].delete(); //удаляем домашку
            }

            await course.update({needToCheck: course.needToCheck});
        }

        if(user){
            let userLearnCaIndex = user.learning.indexOf(CA_id);
            let userTeachCaIndex = user.teaching.indexOf(CA_id);

            if(userLearnCaIndex !== -1){//Удаляем у юзера из learning CA
                user.learning.splice(userLearnCaIndex, 1);
                await user.update({learning: user.learning});
            }
            if(userTeachCaIndex !== -1){//Удаляем у юзера из learning CA
                user.teaching.splice(userTeachCaIndex, 1);
                await user.update({teaching: user.teaching});
            }

        }
        await CA.delete();
        return true;
    } else {
        return false;
    }
}

async function createJoinCourseMessage(course){
    let message = `Вы записались на курс ${course.title}\n\n`
    if(course.meetings && course.meetings.length > 0){
        let firstMeeting = await Meeting.findOne({_id: course.meetings[0]});
        let date = new Date(firstMeeting.date);
        let firstMeetingDate = String(date.getDate() + 1n).padStart(2, "0") + "." + String(date.getMonth() + 1).padStart(2, "0") + "." + String(date.getFullYear());


        message += `Курс уже начался. Занятий прошло: ${course.meetings.length}\n`
        message += `Дата первого занятия (${firstMeeting.title}): ${firstMeetingDate}\n`
        if(course.meetings.length > 1){
            let lastMeeting = await Meeting.findOne({_id: course.meetings[course.meetings.length -1]});
            let date = new Date(lastMeeting.date);
            let lastMeetingDate = String(date.getDate() + 1).padStart(2, "0") + "." + String(date.getMonth() + 1).padStart(2, "0") + "." + String(date.getFullYear());
            message += `Дата последнего занятия (${lastMeeting.title}): ${lastMeetingDate}\n`
        }
    } else {
        message += `Курс ещё не начался.\n`
    }
    if(course.students){
        message += `Студентов на курсе: ${course.students.length}\n\n`;
    }
    message += `Беседа для студентов: ${course.conversation_link || "информации нет"}`;
    return message;
}

export default new courseController();