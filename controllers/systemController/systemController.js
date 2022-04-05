import User from "../../models/User.js";
import Comment from "../../models/Comment.js";
import {createDUMPData} from "./functions/DUMP/createDUMPData.js";
import {createDUMPFile} from "./functions/DUMP/createDUMPFile.js";
import error from "../../auxilary/error.js";
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from "fs";
import {recover} from "./functions/Data/recover.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


class SystemController{
    async createDUMP(req, resp){
        try {
            let data = await createDUMPData()
            let {name, path} = createDUMPFile(data);
            resp.sendFile(path);
        } catch (e){
            resp.json(error(e)).status(404);
        }
    }

    async recover(req, resp){
        try {
            const {name} = req.body;
            let file = fs.readFileSync(path.resolve(__dirname, "..", "..", "dumps", name), {encoding: "utf-8"});
            await recover(JSON.parse(file));
            resp.json("success").status(200);
        } catch (e){
            console.log(e);
            resp.json(error(e)).status(404);
        }
    }
}

export default new SystemController()