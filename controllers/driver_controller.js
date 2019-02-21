const BCRYPT = require('bcryptjs')
const JWT = require('jsonwebtoken')
const DBSTATEMENT = require('../constants/dbquery.js')
const DBA = require('../config/libs.js')
const Promise = require('bluebird')

const SECRET_KEY = '1234@abcd';

/******Mongo Cridentials */
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
const db = require('../databases/mongo_connection.js');

db.create_database();

////////////////DRIVER HANDLER////////////

let driver_id = 0;
let email;
let rest;
let token;

/*******DRIVER ALREADY REGISTERED ********/
exports.driver_is_already_registered = async (req, res, next) => {
    email = req.body.email;

    try {
        rest = await DBA.execQuery(DBSTATEMENT.driver_data, email)
    }
    catch (err) {
        res.json({
            "status_code": 400,
            "error": err.name,
            "message": err.message
        })
    }
    finally {
        if (rest) {
            if (rest.length) {
                res.json({
                    "statusCode": 400,
                    "Error": "Bad Request",
                    "message": "User Already Registered"
                })
            }
            else {
                next();
            }
        }
    }
}

/*************DRIVER SIGNUP ******/
exports.driver_signup = async (req, res, next) => {
    let salt = BCRYPT.genSaltSync(10);
    let password = BCRYPT.hashSync(req.body.password, salt);
    let obj = [req.body.fname, req.body.lname, 1, req.body.email, password, req.body.phone];
    console.log("In sign up function")

    try {
        rest = await DBA.execQuery(DBSTATEMENT.driver_signup, obj)
    }
    catch (err) {
        res.json({
            "status_code": 400,
            "error": err.name,
            "message": err.message
        })
    }
    finally {
        if (rest) {
            console.log("Rest ++++ ", rest)
            let data = { User_Id: rest.insertId, firstname: obj[0], lastname: obj[1], email: obj[3], phone: obj[5] };


            res.json({
                "status": 201,
                "Message": 'Registered successfully',
                "data": data
            });
        }
        else {
            res.json({
                "status": 400,
                "error": err.name,
                "message": err.message
            });
        }
    }
}

/************DRIVER login ********/
exports.driver_login = async (req, res, next) => {
     email = req.body.email;
   let v;
     try{
     rest = await DBA.execQuery(DBSTATEMENT.driver_data, email)
     }
     catch(err)
     {
         res.json({
             "status_code":400,
             "error" : err.name,
             "message" : err.message
         })
     }
     finally{
    if (rest[0]) {
        try{
        v = await BCRYPT.compareSync(req.body.password, rest[0].driver_password);
        }
        catch(err)
        {
            res.json({
                "status_code":400,
                "error" : err.name,
                "message" : err.message
            })
        }
        finally
        {
        if (v) {
            try{
            token = await JWT.sign(email, SECRET_KEY)
            }
            catch(err)
        {
            res.json({
                "status_code" : 400,
                "error":err.name,
                "message" : err.message
            })
        }
        finally{
            if (token) {
                res.json({
                    "status": 200,
                    "Message": 'login successfully',

                    "Data": {
                        Token: token, id: rest[0].driver_id, fname: rest[0].driver_fname, lname: rest[0].driver_lname, email: rest[0].driver_email, phone: rest[0].driver_phone,
                        driver_available: rest[0].driver_available, driver_status: rest[0].driver_status, driver_history: rest[0].driver_history
                    }
                });
            }
            else {
                res.json({
                    "status_code": 400,
                    "message": "Token Generation Error",
                    "data": "Bad Request"
                });
            }
        }
    }
        else {
            res.json({
                "status_code": 400,
                "message": "Password Not Matched",
                "data": "Bad Request"
            })
        }

    }
}
    else {
        console.log('error last')
        res.json({
            "status_code": 400,
            "data": "Bad Request",
            "message": "Email Do Not Exist"
        })
    }
}
}
/******Driver Task Completion */
exports.verify_driver = async function (req, res, next) {
     token = req.body.token

    JWT.verify(token, SECRET_KEY, function (err, decoded) {
        if (err)
            res.json({
                "status_code": 401,
                "error": "Unauthorized",
                "message": "Token Invalid"
            })
        else {
            email = decoded;
        }
    })

    try {
        driver_id = await DBA.execQuery(DBSTATEMENT.get_driver_id, email)
    }
    catch (err) {
            res.json({
                "status_code": 400,
                "error": err.name,
                "message": err.Message
            })
        }
    finally{
    if (driver_id) {
        console.log("driver_id _---", driver_id)
        next();
    }
}
}


/***********Driver update task complete in booking table */
exports.request_completed = function (req, res, next) {
    Promise.coroutine(function* () {
        return yield DBA.execQuery(DBSTATEMENT.request_completed, [driver_id[0].driver_id,driver_id[0].driver_current_status]);
    })().then((value) => {
        if (value.changedRows != 0) {
            next();
        }
        else {
            res.json({
                "status_code": 400,
                "message": "cannot update task_completed",
                "data": "error in parameters"
            })
        }
    })
}

/*********Update Driver available*/
exports.updating_driver_available = function (req, res, next) {
    console.log("updating drivers portion ")
    Promise.coroutine(function* () {
        return yield DBA.execQuery(DBSTATEMENT.update_driver_available, [1, 0, driver_id[0].driver_id]);
    })().then((value) => {
        if (value) {
            console.log("moving to get logs")
            next();
            /*res.json({
                "status_code": 200,
                "message": "task completed successfully",
                "data": value
            })*/
        }
        else {
            res.json({
                "status_code": 400,
                "message": "Error in updating driver table",
                "data": value
            })
        }
    })
}

/***********Get Customer logs  */
exports.put_log = function(req,res,next) {
    Promise.coroutine(function* () {
        console.log("In logs ---")
        return yield DBA.execQuery(DBSTATEMENT.put_log, [driver_id[0].driver_current_status]);
    })().then((value) => {
        if (value) {
          console.log("value ++ ",value)
          console.log("value.booking  ",value.booking_id)
          try {
            MongoClient.connect(url, function (err, db) {
              if (err) throw err;
              var dbo = db.db("my_database");
              var myobj = {
               Booking_id : value[0].booking_id,
               Booking_Placed : value[0].request_history,
               Booking_Completed : value[0].request_completed,
               Driver_Assigning_Time : value[0].Driver_assigning_time,
               Driver : {
                         Driver_Fname : value[0].driver_fname,
                         Driver_Lname : value[0].driver_lname,
                         Driver_Phone : value[0].driver_phone,
                         Driver_email : value[0].driver_email
                       } ,
               From :     {
                            Latitute : value[0].source_lat,
                            Longitude : value[0].source_long 
                          } ,
                To  :     {
                             Latitude : value[0].dest_lat,
                             Longitude : value[0].dest_long
                          },
            };
        
              let collection_name = "customer_logs";
        
              dbo.collection(collection_name).insertOne(myobj, function (err, res) {
                if (err)
                {
                    res.json({
                        "status_code":400,
                        "error":err.name,
                        "message":err.message
                    })
                }
                else{
                    res.json({
                        "status_code":200,
                        "message":"Log saved Successfully",
                        "data":res
                    })
                }

              });
            });
        
          } catch (err) {
            res.json({
                "status_code":400,
                "error":err.name,
                "message":err.message
            })
          }
          finally{
            console.log("1 document inserted");
            db.close();
           
          }

        }
        else {
            res.json({
                "status_code": 400,
                "message": "Error in getting customer list",
                "data": value
            })
        }
    }) 
}
/***********Driver view assigned customer */
exports.list_of_assigned_customers = function (req, res, next) {
    Promise.coroutine(function* () {
        return yield DBA.execQuery(DBSTATEMENT.assigned_customers, [driver_id[0].driver_id]);
    })().then((value) => {
        if (value) {
            res.json({
                "status_code": 200,
                "message": "list of the asssigned customers",
                "data": value
            })
        }
        else {
            res.json({
                "status_code": 400,
                "message": "Error in getting customer list",
                "data": value
            })
        }
    })
}

/****************Driver */