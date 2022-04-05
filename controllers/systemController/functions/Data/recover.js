import {removeAll} from "./removeAll.js";
import CourseAccount from "../../../../models/CourseAccount.js";
import Course from "../../../../models/Course.js";
import Meeting from "../../../../models/Meeting.js";
import Task from "../../../../models/Task.js";
import Grade from "../../../../models/Grade.js";
import Article from "../../../../models/Article.js";
import User from "../../../../models/User.js";
import Notification from "../../../../models/Notification.js";
import Role from "../../../../models/Role.js";
import Homework from "../../../../models/Homework.js";
import Comment from "../../../../models/Comment.js";

export async function recover(data){

    //Костыль, так как данные базы дев сервера стали невалидными после нововведений
    let count = 0;

    data.User.forEach(item => {
        if(!item.vk_id){
            item.vk_id = ++count;
        }
    })

    await removeAll();

    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        if(key === "CourseAccount"){
            for (let j = 0; j < data[key].length; j++) {
                let item = data[key][j];
                await CourseAccount.create({...item});
            }
        } else if(key === "Course"){
            for (let j = 0; j < data[key].length; j++) {
                let item = data[key][j];
                await Course.create({...item});
            }
        } else if(key === "Meeting"){
            for (let j = 0; j < data[key].length; j++) {
                let item = data[key][j];
                await Meeting.create({...item});
            }
        } else if(key === "Task"){
            for (let j = 0; j < data[key].length; j++) {
                let item = data[key][j];
                await Task.create({...item});
            }
        } else if(key === "Grade"){
            for (let j = 0; j < data[key].length; j++) {
                let item = data[key][j];
                await Grade.create({...item});
            }
        } else if(key === "Article"){
            for (let j = 0; j < data[key].length; j++) {
                let item = data[key][j];
                await Article.create({...item});
            }
        } else if(key === "User"){
            for (let j = 0; j < data[key].length; j++) {
                let item = data[key][j];
                await User.create({...item});
            }
        } else if(key === "Notification"){
            for (let j = 0; j < data[key].length; j++) {
                let item = data[key][j];
                await Notification.create({...item});
            }
        } else if(key === "Role"){
            for (let j = 0; j < data[key].length; j++) {
                let item = data[key][j];
                await Role.create({...item});
            }
        } else if(key === "Homework"){
            for (let j = 0; j < data[key].length; j++) {
                let item = data[key][j];
                await Homework.create({...item});
            }
        } else if(key === "Comment"){
            for (let j = 0; j < data[key].length; j++) {
                let item = data[key][j];
                await Comment.create({...item});
            }
        }
    }
}