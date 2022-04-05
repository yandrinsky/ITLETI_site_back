import CourseAccount from "../../../../models/CourseAccount.js";
import Course from "../../../../models/Course.js";
import Comment from "../../../../models/Comment.js";
import Grade from "../../../../models/Grade.js";
import Homework from "../../../../models/Homework.js";
import Meeting from "../../../../models/Meeting.js";
import Role from "../../../../models/Role.js";
import Task from "../../../../models/Task.js";
import User from "../../../../models/User.js";
import Article from "../../../../models/Article.js";
import Notification from "../../../../models/Notification.js";

export async function removeAll(){
    await CourseAccount.deleteMany({});
    await Course.deleteMany({});
    await Comment.deleteMany({});
    await Grade.deleteMany({});
    await Homework.deleteMany({});
    await Meeting.deleteMany({});
    await Role.deleteMany({});
    await Task.deleteMany({});
    await User.deleteMany({});
    await Article.deleteMany({});
    await Notification.deleteMany({});
}