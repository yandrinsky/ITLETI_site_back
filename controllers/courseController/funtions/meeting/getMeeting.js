import Meeting from "../../../../models/Meeting.js";

export async function getMeeting({_id, CA}){
    const meeting = await Meeting.findOne({_id});
    return {
        title: meeting.title,
        content: meeting.content,
        signup: meeting.students.includes(CA?._id),
        active: meeting.active,
        date: meeting.date,
        id: meeting._id,
        link: meeting.link,
        CQ: meeting.CQ,
        CQ_title: meeting.CQ_title,
        CQ_answer: CA?.role === "TEACHER" ? meeting.CQ_answer : null,
    }
}