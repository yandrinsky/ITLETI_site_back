function error(error, code){
    return {
        message: [error],
        code,
    }
}

export default error;