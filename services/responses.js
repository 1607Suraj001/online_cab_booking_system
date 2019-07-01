/*
@  response after successful API execution
*/
exports.success = (res,message,data)=>
{
    res.json({
        "status_code":200,
        "message" : message,
        "data" : data
    })
}
/*
@  response in case of invalid inputs entered by the employee
*/
exports.bad_request = (res,err)=>{
    res.json({
        "status_code":400,
        "error" : err.name,
        "message":err.message
    })
}
/*
@ response in case when there are No input errors 
@ error occured with the database
*/
exports.bad_success = (res,error,message)=>{
    res.json({
        "status_code":401,
        "error":error.name,
        "message":message
    })
}

/*
@ response in case of internal error in database
*/
exports.error = (res,error,message)=>{
    res.json({
        "status_code":400,
        "error":error,
        "message":message
    })
}