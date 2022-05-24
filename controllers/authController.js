import User from "../models/User.js";
import Role from "../models/Role.js";
import bcrypt from "bcryptjs";
import {validationResult} from "express-validator";
import jwt from "jsonwebtoken";
import {secret} from "../config.js";
import error from "../auxilary/error.js";
import {sendMessage, testMessage} from "../VK/bot/bot.js";
import md5 from "md5";
import {VK_SECRET_KEY} from "../ENV.js";



const generateAccessToken = (id, roles, vk_id, username) => {
    const payload = {
        id,
        roles,
        vk_id,
        username
    }
    return jwt.sign(payload, secret, {expiresIn: "2h"});
}


class authController {

    async registration(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка при регистрации", errors});
            }

            const {name, surname, group, vk_id, vk_link, password, username} = req.body;

            const candidate = await User.findOne({vk_id});
            const copies = await User.find({username})
            console.log("copies", copies);
            if(copies.length > 0){
                return resp.status(400).json({message: "Пользователь с таким username уже существует"});
            }

            let res = await testMessage(vk_id);
            if(res === true){
                let pass = bcrypt.hashSync(password, 7)
                if(!candidate){
                    await User.create({name, surname, roles: ["USER"], group, vk_id, username, password: pass});
                    await sendMessage(`
                        Вы успешно зарегистрировались на сайте IT-ЛЭТИ.\n\n
                        Подробнее ознакомиться с IT-ЛЭТИ:
                        https://vk.com/@itleti-manifest-it-leti\n\n
                        Список наших актуальных курсов:
                        https://vk.com/@itleti-spisok-meropriyatii-osen-2021\n\n
                        
                    `, vk_id);
                } else {
                    await User.updateOne({vk_id}, {name, surname, group, vk_id, username, password: pass});
                }
                console.log("register");
                console.log("password", password);
                console.log("pass", pass);
            }
            return resp.status(200).json(res);
        } catch (e){
            console.error(e);

            resp.status(400).json({message: "Registration error"});
        }
    }

    async setUsernameAndPassword(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка добавления логина и пароля", errors});
            }
            const {username, password} = req.body;
            if(username && password){
                return resp.status(400).json({message: "Неподходящий логин или пароль", errors});
            }
            console.log("req.user._id", req.user.id);
            //await User.updateOne({_id: req.user.id}, {username, password});
            resp.status(200).json("ok")

        } catch (e){
            return resp.status(400).json(error("Ошибка добавления логина и пароля"));
        }
    }

    async login(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                //console.log("req.body", req.body);
                console.log("Ошибка при логинизации");
                return resp.status(400).json({message: "Ошибка при логинизации", errors});
            }

            const {vk_id, expire, mid, sid, cookie, secret, username, password} = req.body;
            let user;
            if(!username){
                const secretKey = VK_SECRET_KEY;
                const sig = req.body.sig ? req.body.sig : cookie.split("&").splice(-1)[0].split("=")[1];


                if(md5((cookie ?
                    cookie.split("&").slice(0, -1).join("") + secretKey :
                    `expire=${expire}mid=${mid}secret=${secret}sid=${sid}`+ secretKey)) !== sig)
                {

                    resp.status(400).json({message: "Login error: не прошла проверка подписи"});

                    return;
                }


                user = await User.findOne({vk_id});
                if(!user){
                    return resp.status(400).json({message: "Пользователь не найден"})
                }
            } else if(username) {
                user = await User.findOne({username});
                console.log("password", password);
                let pss = bcrypt.hashSync(password, 7);
                console.log(pss);
                console.log(user.password);
                const isValidPassword = bcrypt.compareSync(password, user.password); //сравнит пароль и хеш вернёт bool

                if(!isValidPassword){
                    return resp.status(400).json({message: "Неверный пароль"});
                }
            }

            const token = generateAccessToken(user._id, user.roles, vk_id, user.username);

            return resp.json({token, expiresIn: 3600 * 3, roles: user.roles, name: user.name + " " + user.surname, username: user.username, group: user.group});

        } catch (e){
            console.error(e);
            resp.status(400).json({message: "Login  error"});
        }
    }

    validToken(req, resp){
        const {token} = req.body;
        try{
            req.user = jwt.verify(token, secret);
            resp.json("ok");

        } catch (e){
            resp.status(400).json(error("Bad token"));
        }

    }

    async testMessage(req, resp){
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return resp.status(400).json({message: "Не указан user_id", errors});
        }
        let res = await testMessage(req.body.user_id);
        if(res === true || res === false){
            resp.json(res);
        } else {
            resp.status(400).json(res);
        }
    }

    async getUsers(req, resp){
        try{
            let users = await User.find();
            resp.json(users);
        } catch (e){

        }
    }

    async changeRole(req, resp){
        try{
            const {id, role} = req.body;
            const user = await User.findOne({_id: id});
            if(!user){
                return resp.status(404).json({message: "Пользователь не найден"});
            }
            user.roles = [role];

            await User.updateOne({_id: id}, user);

            return resp.status(200);


        } catch (e) {
            return resp.status(400).json({message: "Ошибка при обновлении роли"});
        }
    }
    async specFixUsers(req, resp){
        try{
            await User.syncIndexes();
            resp.json({message: "ok"});
        } catch (e) {
            console.log(e)
            resp.status(400).json({message: "error"})
        }

    }
}

export default new authController();