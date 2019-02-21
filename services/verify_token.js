  const JWT  = require('jsonwebtoken')
  const Promise = require('bluebird')
 
  const SECRET_KEY= '1234@abcd';
  
exports.verify_token=(token)=> {
    return new Promise((resolve, reject)=> {
      JWT.verify(token,SECRET_KEY,(err,result)=>{
          if(err)
          reject(err)
          else
          resolve(result)
      })  })
}
