import mongoose from "mongoose";

const Meeting = new mongoose.Schema({
    attendance: {type: Number, default: 0},
    students: {type: Array, default: []},
    title: String,
    content: String,
    link: {type: Boolean, default: false}, //Возможноть отметиться только по ссылке на форму
    CQ: {type: Boolean, default: false}, //Control Question
    CQ_title: {type: String}, //Сам контрольный вопрос
    CQ_answer: {type: String}, //Ответ на контрольный вопрос
    active: {type: Boolean, default: true},
    grade: {type: String, ref: "Grade"},
    date: Date,
})

export default mongoose.model('Meeting', Meeting);