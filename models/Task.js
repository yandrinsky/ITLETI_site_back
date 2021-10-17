import mongoose from "mongoose";

const Task = new mongoose.Schema({
    title: String,
    content: String, //HTML
    status: {type: String, default: "OPEN"}, //OPEN, CLOSE
    author_id: {type: String, ref: 'CourseAccount'},
    course_id: {type: String, ref: 'Course'},
    date: Date,
    death_time: Date,
})

export default mongoose.model('Task', Task);