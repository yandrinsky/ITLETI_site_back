import User from "../models/User.js";
import Role from "../models/Role.js";
import bcrypt from "bcryptjs";
import {validationResult} from "express-validator";
import jwt from "jsonwebtoken";

import {secret} from "../config.js";
import error from "../auxilary/error.js";
import {sendMessage, testMessage} from "../VK/bot/bot.js";
import md5 from "md5";
import {vk_secretKey} from "../VK/params.js";




const generateAccessToken = (id, roles, vk_id) => {
    const payload = {
        id,
        roles,
        vk_id
    }
    return jwt.sign(payload, secret, {expiresIn: "2h"});
}


class authController {
    // async registration(req, resp){
    //     try{
    //         const errors = validationResult(req);
    //         if(!errors.isEmpty()){
    //             return resp.status(400).json({message: "Ошибка при регистрации", errors});
    //         }
    //
    //         const {username, password, name, surname, group, vk} = req.body;
    //         const candidate = await User.findOne({username});
    //
    //         if(candidate){
    //             return resp.status(400).json({message: "Пользователь с таким статусом уже существует"});
    //         }
    //
    //         const hashPassword = bcrypt.hashSync(password, 7);
    //
    //         await User.create({username, password: hashPassword,  name, surname, roles: ["USER"], group, vk});
    //
    //         return resp.status(200).json("ok");
    //     } catch (e){
    //         console.error(e);
    //         resp.status(400).json({message: "Registration error"});
    //     }
    // }
    async registration(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return resp.status(400).json({message: "Ошибка при регистрации", errors});
            }

            const {name, surname, group, vk_id, vk_link} = req.body;

            const candidate = await User.findOne({vk_id});

            if(candidate){
                return resp.status(400).json({message: "Пользователь с таким статусом уже существует"});
            }

            let res = await testMessage(vk_id);
            if(res === true){
                await User.create({name, surname, roles: ["USER"], group, vk_id, vk_link});
                sendMessage(`
                    Вы успешно зарегистрировались на сайте IT-ЛЭТИ.\n\n
                    Подробнее ознакомиться с IT-ЛЭТИ:
                    https://vk.com/@itleti-manifest-it-leti\n\n
                    Список наших актуальных курсов:
                    https://vk.com/@itleti-spisok-meropriyatii-osen-2021\n\n
                    
                `, vk_id);
            }
            return resp.status(200).json(res);
        } catch (e){
            console.error(e);
            resp.status(400).json({message: "Registration error"});
        }
    }

    async login(req, resp){
        try{
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                console.log("req.body", req.body);
                return resp.status(400).json({message: "Ошибка при логинизации", errors});
            }

            const {vk_id, expire, mid, sid, cookie} = req.body;
            const secretKey = vk_secretKey;
            const sig = req.body.sig ? req.body.sig : cookie.split("&").splice(-1)[0].split("=")[1];
            if(md5((cookie ?
                cookie.split("&").slice(0, -1).join("") + secretKey :
                `expire=${expire}mid=${mid}secret=oauthsid=${sid}` + secretKey)) !== sig)
            {
                resp.status(400).json({message: "Login error: не прошла проверка подписи"});
                return;
            }


            const user = await User.findOne({vk_id});
            if(!user){
                return resp.status(400).json({message: "Пользователь не найден"})
            }

            //const isValidPassword = bcrypt.compareSync(password, user.password); //сравнит пароль и хеш вернёт bool

            // if(!isValidPassword){
            //     return resp.status(400).json({message: "Неверный пароль"});
            // }

            const token = generateAccessToken(user._id, user.roles, vk_id);

            return resp.json({token, expiresIn: 3600 * 3, roles: user.roles, name: user.name + " " + user.surname});

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
}

export default new authController();