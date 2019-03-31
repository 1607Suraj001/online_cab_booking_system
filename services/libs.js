const DB = require('../databases/mysql_connection.js')

/******Method to execute database ****/
exports.execQuery = (query,param) => {
    console.log("Query :: ",query)
    console.log("param :: ",param)
    return new Promise((resolve,reject)=>{
        DB.connection.query(query, param, (err,result) => {
            if(err)
            reject(err)
            console.log(result)
            resolve(result)
        })
    })
}