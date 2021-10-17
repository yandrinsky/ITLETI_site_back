import mongoose from "mongoose";

const Notification = new mongoose.Schema({
    author_id: {type: String, ref: 'User'},
    date: Date,
    content: String,
    title: String,
})

export default mongoose.model('Notification', Notification);