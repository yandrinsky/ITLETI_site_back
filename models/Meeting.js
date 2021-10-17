import mongoose from "mongoose";

const Meeting = new mongoose.Schema({
    attendance: {type: Number, default: 0},
    date: Date,
})

export default mongoose.model('Meeting', Meeting);