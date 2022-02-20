import mongoose from "mongoose";

const User = new mongoose.Schema({
    // username: {type: String, unique: true, required: true},
    // password: {type: String, required: true},
    name: {type: String, required: true},
    surname: {type: String, required: true},
    roles: [{type: String, ref: 'Role'}],
    group: [{type: String}],
    vk: {type: String},
    vk_link: {type: String},
    vk_id: {type: String, unique: true, required: true},
    learning: {type: Array, default: []}, //course_account, course_account
    teaching: {type: Array, default: []}, //course_account, course_account
    favorite_courses: [{type: Array, ref: 'Course', required: true}],
})

export default mongoose.model('User', User);