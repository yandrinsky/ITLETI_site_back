import mongoose from "mongoose";

const Grade = new mongoose.Schema({
    accounts: [],
    comments: [],
    "5": {type: Number, default: 0},
    "4": {type: Number, default: 0},
    "3": {type: Number, default: 0},
    "2": {type: Number, default: 0},
    "1": {type: Number, default: 0},
    active: {type: Boolean, default: true},
})

export default mongoose.model('Grade', Grade);