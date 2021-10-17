import mongoose from "mongoose";

const Comment = new mongoose.Schema({
    author_id: String,
    type: String, //STUDENT or TEACHER
    date: Date,
    content: String,
    replies: {type: Array, ref: 'Comment'}
})

export default mongoose.model('Comment', Comment);