import mongoose from "mongoose";

const Task = new mongoose.Schema({
    title: String,
    content: String, //HTML
    status: {type: String, default: "OPEN"}, //OPEN, CLOSE
    author_id: {type: String, ref: 'CourseAccount'},
    course_id: {type: String, ref: 'Course'},
    lang: {type: String},
    contentType: {type: String, default: "TEXT"}, //LINK, CODE, TEXT
    type: {type: String, default: "HOMEWORK"}, //HOMEWORK, TASK
    frame: {type: Boolean, default: false},
    frameOption: {type: String},
    resource: {type: String},
    date: Date,
    death_time: Date,
})

export default mongoose.model('Task', Task);