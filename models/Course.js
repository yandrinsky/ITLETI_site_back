import mongoose from "mongoose";

const Course = new mongoose.Schema({
    title: {type: String, required: true, unique: false},
    join: {type: Boolean, default: true},
    description: {type: String, default: "Краткое описание курса"},
    about: {type: String, default: "Развёрнутое описание курса"},
    conversation_link: {type: String},
    preview: {type: String, default: "logo_it_leti.jpg"},
    status: {type: String, default: "active"}, // active / passive / archived
    authors: [{type: String, ref: 'CourseAccount'}],
    teachers: [{type: String, ref: 'CourseAccount'}],
    students: [{type: String, ref: 'CourseAccount'}], //Изменение с type: Array -> type: String
    articles: [{type: String, ref: 'Article'}],
    notifications: [{type: String, ref: 'Notification'}],
    tasks: [{type: String, ref: 'Task'}],
    needToCheck: [{type: String, ref: 'Homework'}],
    meetings: [{type: String, ref: 'Meeting'}],
})

export default mongoose.model('Course', Course);