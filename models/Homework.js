import mongoose from "mongoose";

const Homework = new mongoose.Schema({
    course_account_id: {type: String, ref: 'CourseAccount'},
    task_id: {type: String, ref: 'Task'},
    content: String,
    comments: Array,
    date: Date,
    checked: {type: Boolean, default: false},
    passed: {type: Boolean, default: false},
    tries: {type: Number, default: 0},
})

export default mongoose.model('Homework', Homework);