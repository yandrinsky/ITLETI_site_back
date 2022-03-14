import Course from "../models/Course.js";
import Task from "../models/Task.js";
import CourseAccount from "../models/CourseAccount.js";
import {sendMessage} from "../VK/bot/bot.js";
import User from "../models/User.js";
import Meeting from "../models/Meeting.js";
import Homework from "../models/Homework.js";


async function each(CAS, message){
    if(CAS.length > 0){
        for (let i = 0; i < CAS.length; i++) {
            const ca = CAS[i];
            const user = await User.findOne({_id: ca.user_id});
            if(user){
                await sendMessage(message, user.vk_id);
            }
        }
    }
}

class Notification{
    async newTask(course_id, task_id){
        const course = await Course.findOne({_id: course_id});
        const task = await Task.findOne({_id: task_id});
        const CAS = await CourseAccount.find({_id: course.students});

        await each(CAS,
            `
                    Задано новое задание 📝 по курсу "${course.title}":
                    ${task.title}
                    
                    Подробнее: http://itleti.web.app/tasks/${task._id}'
                `
        );

        // if(CAS.length > 0){
        //     for (let i = 0; i < CAS.length; i++) {
        //         const ca = CAS[i];
        //         const user = await User.findOne({_id: ca.user_id});
        //         if(user){
        //             //Подробнее: http://itleti.web.app/tasks/${task._id}'
        //             console.log("SEND MESS vk_id", user.vk_id);
        //             // console.log("SEND MESS user", user);
        //             await sendMessage(`
        //             Задано новое задание 📝 по курсу "${course.title}":
        //             ${task.title}
        //
        //             Подробнее: http://itleti.web.app/tasks/${task._id}'
        //         `, user.vk_id);
        //         }
        //
        //     }
        // }
    }

    async startMeeting(course_id, meeting_id){
        const course = await Course.findOne({_id: course_id});
        const meeting = await Meeting.findOne({_id: meeting_id});
        const CAS = await CourseAccount.find({_id: course.students});
        await each(CAS, `
            🔔 Начато новое занятие по курсу "${course.title}":
            ${meeting.title}
            Подробнее: http://itleti.web.app/courses/${course._id}'
        `)
    }

    async checkHomework(course_id, homework_id, result){
        const course = await Course.findOne({_id: course_id});
        const homework = await Homework.findOne({_id: homework_id});
        const CAS = await CourseAccount.find({_id: course.students});

        await each(CAS, `
            🔔 Начато новое занятие по курсу "${course.title}":
            ${meeting.title}
            Подробнее: http://itleti.web.app/courses/${course._id}'
        `)
    }

}

export default new Notification();