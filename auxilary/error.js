function error(...errors){
    return {
        message: [...errors]
    }
}

export default error;