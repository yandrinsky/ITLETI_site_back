import mongoose from "mongoose";

const Meeting = new mongoose.Schema({
    attendance: {type: Number, default: 0},
    students: {type: Array, default: []},
    title: String,
    content: String,
    active: {type: Boolean, default: true},
    date: Date,
})

export default mongoose.model('Meeting', Meeting);