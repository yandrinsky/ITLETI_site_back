import mongoose from "mongoose";

const Article = new mongoose.Schema({
    title: String,
    content: String, //HTML
    author_id: {type: String, ref: 'User'},
    date: Date,
})

export default mongoose.model('Article', Article);