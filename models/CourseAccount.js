import mongoose from "mongoose";

const CourseAccount = new mongoose.Schema({
    role: {type: String, default: "STUDENT"}, //STUDENT / TEACHER
    course_id: String,
    status: {type: String, default: "ACTIVE"}, //ACTIVE / PASSIVE / EXPELLED
    user_id: String,

    homeworks: Array, //[[taskId]: Boolean],
    attendance: Array,//[[meetingId]: Boolean],
})

export default mongoose.model('CourseAccount', CourseAccount);