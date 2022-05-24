import express from "express";
import mongoose from "mongoose";
import authRouter from "./routers/authRouter.js";
import courseRouter from "./routers/courseRouter.js";
import cors from "cors";
import statisticsRouter from "./routers/statisticsRouter.js";
import systemRouter from "./routers/systemRouter.js";
import {DEV_URL, PROD_URL} from "./ENV.js";


const app = express();
const PORT = process.env.PORT || 5000;

//production
const BASE_URL = PROD_URL;


//dev
//const BASE_URL = DEV_URL;

app.use(express.json());
app.use(cors()); //позволяет делать запросы к нашему api с посторонних доменов.
app.use(express.static("./assets/img")); //чтобы express отдавал статические файлы по запросу ("static") - название папки
//то есть в вёрстке можно будет писать img src="сервер/название файла".

app.use('/auth', authRouter);
app.use('/courses', courseRouter);
app.use('/statistics', statisticsRouter);
app.use('/system', systemRouter);


const start = async () => {
    try{
        await mongoose.connect(BASE_URL)
        app.listen(PORT, () => console.log("Server started on port" + PORT))
    } catch (e){
        console.log("cant access to server");
        console.error(e);
    }
}

start();