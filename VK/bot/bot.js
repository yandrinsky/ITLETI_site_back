import {VK, MessageContext, getRandomId } from "vk-io";
import {TOKEN} from "./config.js";
import { API } from 'vk-io';
import error from "../../auxilary/error.js";

const api = new API({
    token: TOKEN,
});

const vk = new VK({
    token: TOKEN,
})


export async function testMessage(user_id){
    let result;
    let status;
    try {

        result = await api.messages.send({
            peer_id: user_id,
            random_id: getRandomId(),
            message: "TEST",
        })

        await api.messages.delete({
            message_id: result,
            peer_id: user_id,
            delete_for_all: 1,
        })

        status = true;
    } catch (e) {
        status = false;
        if(e.code !== 901) {
            status = error("Error with testMessage, VK code: " + e.code);
        }
    }
    return status;
}
export async function sendMessage(message, user_id){
    let result;
    let status;
    let sep = "---------------------------------------------";
    try {
        result = await api.messages.send({
            peer_id: user_id,
            random_id: getRandomId(),
            message: message + "\n",
        })
        status = true;
    } catch (e) {
        status = false;
    }

    return status;



    //let context = new MessageContext(vk)
    // let res = await context.send(message, {
    //     user_id,
    //     random_id: Date.now(),
    //     peer_id: user_id,
    // })
    // console.log("send res", res);
}

