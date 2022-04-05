import CourseAccount from "../../../../models/CourseAccount.js";
import User from "../../../../models/User.js";
import Role from "../../../../models/Role.js";
import Task from "../../../../models/Task.js";
import Meeting from "../../../../models/Meeting.js";
import Homework from "../../../../models/Homework.js";
import Grade from "../../../../models/Grade.js";
import Course from "../../../../models/Course.js";
import Comment from "../../../../models/Comment.js";
import Article from "../../../../models/Article.js";
import Notification from "../../../../models/Notification.js";

export async function createDUMPData(){
    let CAS = await CourseAccount.find({});
    let Courses = await Course.find({});
    let Comments = await Comment.find({});
    let Grades = await Grade.find({});
    let Homeworks = await Homework.find({});
    let Meetings = await Meeting.find({});
    let Roles = await Role.find({});
    let Tasks = await Task.find({});
    let Users = await User.find({});
    let Articles = await Article.find({});
    let Notifications = await Notification.find({});

    const data = {
        CourseAccount: CAS,
        Course: Courses,
        Comment: Comments,
        Grade: Grades,
        Homework: Homeworks,
        Meeting: Meetings,
        Role: Roles,
        Task: Tasks,
        User: Users,
        Article: Articles,
        Notification: Notifications,
    }

    return data;
}