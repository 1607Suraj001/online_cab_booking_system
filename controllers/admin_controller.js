const BCRYPT = require('bcryptjs')
const JWT = require('jsonwebtoken')
const DBSTATEMENT = require('../constants/dbquery.js')
const DBA = require('../config/libs.js')
const Promise = require('bluebird')
const SECRET_KEY = '1234@abcd';

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
const db = require('../databases/mongo_connection.js');

db.create_database();
/////////////ADMIN HANDLER ////////////////
let customer_data;
let driver_data;
let email
let rest
let available_driver
let booking_id
/*****ADMIN REGISTERATION */
exports.signup = async (req, res, next) => {

    let salt = BCRYPT.genSaltSync(10);
    let password = BCRYPT.hashSync(req.body.password, salt);
    let obj = [req.body.fname, req.body.lname, req.body.email, password, req.body.phone];
    console.log("In sign up function")
    try {
        rest = await DBA.execQuery(DBSTATEMENT.signup, obj);
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
            let data = { User_Id: rest.insertId, firstname: obj[0], lastname: obj[1], email: obj[2], phone: obj[4] };

            res.json({
                "status": 200,
                "Message": 'Registered succesfully',
                "Data": data
            });
        }
        else {
            res.json({
                "status": 400,
                "Message": 'Invalid Username or Password',
                "ERROR": rest.ERROR
            });
        }
    }
}
/************* Checking Admin Already */
exports.is_already_registered = async (req, res, next) => {
    let email = req.body.email;

    let rest = await DBA.execQuery(DBSTATEMENT.admin_data, email)

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

/*********logging in user & Generating token */
exports.login = async (req, res, next) => {
    let email = req.body.email;
    console.log('Email +++ ', email)

    let rest = await DBA.execQuery(DBSTATEMENT.admin_data, email)

    if (rest[0]) {
        let v = await BCRYPT.compareSync(req.body.password, rest[0].admin_password);
        if (v) {
            let token = await JWT.sign(email, SECRET_KEY)

            if (token) {
                res.json({
                    "status": 200,
                    "Message": 'login successfully',
                    "Data": { Token: token, id: rest[0].admin_id, fname: rest[0].admin_fname, lname: rest[0].admin_lname, email: rest[0].admin_email, phone: rest[0].admin_phone }
                });
            }
            else {
                res.json({
                    "statusCode": 400,
                    "error": "Bad Request",
                    "message": "Token Generation Error"
                });
            }
        }
        else {
            res.json({
                "statusCode": 400,
                "error": "Bad Request",
                "message": "Password Not Matched"
            })
        }

    }

    else {
        console.log('error last')
        res.json({
            "statusCode": 400,
            "Error": "Bad Request",
            "Message": "Email Do Not Exist"
        })
    }
}

/**************Verify admin */
exports.verify_admin = async function (req, res, next) {
    JWT.verify(req.body.token, SECRET_KEY, function (err, decoded) {
        if (err)
            res.json({
                "statusCode": 401,
                "error": "Unauthorised",
                "message": err.message
            })
        else {
            email = decoded;
        }
    })

    if (email) {
        try {
            let rest = await DBA.execQuery(DBSTATEMENT.admin_data, email)
        }
        catch (err) {
            res.send({
                "status_code": 400,
                "message": "User Not Admin",
                "data": err
            })
        }
        finally {
            next();
        }
    }
}

/*******View all admin details */
exports.view_all_admin = async (req, res, next) => {
    Promise.coroutine(function* () {
        return yield DBA.execQuery(DBSTATEMENT.all_admin_data, []);
    })().then((value) => {
        if (value) {
            res.json({
                "status_code": 200,
                "message": "list of the admin",
                "data": value
            })
        }
        else {
            res.json({
                "status_code": 400,
                "message": "Error in getting admin list",
                "data": value
            })
        }
    })

}


/**********Getting details of the pending request******/
exports.get_pending_requests = async (req, res, next) => {
    let email;
    let data;
    JWT.verify(req.body.token, SECRET_KEY, function (err, decoded) {
        if (err)
            res.json({
                "statusCode": 401,
                "error": "Unauthorised",
                "message": err.message
            })
        else
            email = decoded;
    })
    // Verify admin or not
    let rest = await DBA.execQuery(DBSTATEMENT.verify_admin, email, function (err) {
        if (err)
            res.send(err.message)
    })
    if (rest) {
        // get all pending details 
        try {
            data = await DBA.execQuery(DBSTATEMENT.get_pending_requests, 1)
        }
        catch (err) {
            res.json(
                {
                    "status_code": 400,
                    "message": "Pending requests Not found",
                    "data": err.message

                })
        }

        console.log('right now ++++ ', data)
        if (data) {
            res.json({
                "status_code": 200,
                "message": "list of pending requests",
                "data": data
            })
        }
    }
}

/********Get the available drivers */
exports.get_available_drivers = async (req, res, next) => {
    let rest;
    console.log("get_available_drivers")
    try {
        rest = await DBA.execQuery(DBSTATEMENT.get_available_drivers, 1)
    }
    catch
    {
        if (err)
            res.send({
                "status_code": 400,
                "message": "Error in getting available drivers",
                "data": err.message
            })
    }

    if (rest) {
        res.json({
            "status_code": 200,
            "message": "List of the available drivers",
            "data": rest
        })
    }
}

////////////// Assign Driver update booking table 
exports.assign_driver = async (req, res) => {
    try {
        available_driver = req.body.available_drivers;
        booking_id = req.body.booking_id;
        console.log("adasd ,, dad", available_driver, booking_id)

        rest = await DBA.execQuery(DBSTATEMENT.assign_driver, [available_driver, 0, booking_id])

    }
    catch (err) {
        console.log("lasr rest +++++===", rest)
        res.json({
            "status_code": 400,
            "message": err.name,
            "data": err.message
        })
    }
    finally {
        if (rest.changedRows) {
            res.json({
                "status_code": 200,
                "message": "Driver Successfully assigned and Booking Confirmed",
                "data": rest
            })
        }
        else {
            res.json({
                "status_code": 400,
                "message": "Driver Not Assigned",
                "data": rest
            })
        }
    }
}
/************Update Driver Avilable */
exports.update_driver_available = async (req, res, next) => {
    let rest
    let available_driver = req.body.available_drivers;
    let booking_id = req.body.booking_id;
    try {
        rest = await DBA.execQuery(DBSTATEMENT.update_driver_available, [0, booking_id, available_driver])
        console.log("rest ----- )))", rest)
    }
    catch (err) {
        console.log("ERROR ", err)
        res.json({
            "status_code": 400,
            "message": "Error in assigning booking to driver",
            "data": err.message
        })
    }
    console.log("rest -----", rest)
    if (rest) {
        next();
    }
}

/*************** Get customer logs*/
exports.get_logs = function (req, res) {
    Promise.coroutine(function* () {
        return yield DBA.execQuery(DBSTATEMENT.get_booking_data, booking_id);
    })().then((value) => {
        if (value) {
            res.json({
                "status_code": 200,
                "message": "list of the admin",
                "data": value
            })
        }
        else {
            res.json({
                "status_code": 400,
                "message": "Error in getting admin list",
                "data": value
            })
        }
    })

}

/************Get logs */
exports.get_logs_particular = function (req, res) {
    try {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
             let dbo = db.db("my_database");
             console.log(req.body.booking_id)
            let myobj = { Booking_id: req.body.booking_id.toString()};

            let collection_name = "customer_logs";
            dbo.collection(collection_name).findOne(myobj, function (err, res) {
                if (err) {
                    console.log("In first if")
                    res.json({
                        "status_code": 400,
                        "error": err.name,
                        "message": err.message
                    })
                }
                console.log("adddddd",res)
                    if (res) {
                        console.log("ins second if",res)
                        res.json({
                            "status_code": 200,
                            "message": "Booking Logs",
                            "data": res
                        })
                    }
            })

        })
    }
    catch (err) {
        console.log("in catch")
       res.json({
           "status_code" : 400,
           "error" : err.name,
           "message" : err.message
       })
    }
    
}
/////////////  CUSTOMER HANDLER ///////////

//let customer_id;

/*********CUSTOMER is already registered
exports.customer_is_already_registered = async (req, res, next) => {
    let email = req.body.email;

    let rest = await DBA.execQuery(DBSTATEMENT.customer_data, email)

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

/****************CUSTOMER signup
exports.customer_signup = async (req, res, next) => {

    let salt = BCRYPT.genSaltSync(10);
    let password = BCRYPT.hashSync(req.body.password, salt);
    let obj = [req.body.fname, req.body.lname, req.body.email, password, req.body.phone];
    console.log("In sign up function")
    let rest = await DBA.execQuery(DBSTATEMENT.customer_signup, obj, function (err) {
        if (err)
            console.log("error +==++ ", err)
    });

    if (rest) {
        console.log("Rest ++++ ", rest)
        let data = { User_Id: rest.insertId, firstname: obj[0], lastname: obj[1], email: obj[2], phone: obj[4] };

        res.json({
            "status": 201,
            "Message": 'Registered succesfully',
            "Data": data
        });
    }
    else {
        res.json({
            "status": 400,
            "Message": 'Invalid Username or Password',
            "ERROR": rest.ERROR
        });
    }
}

/**********CUSTOMER LOGIN *****
exports.customer_login = async (req, res, next) => {
    let email = req.body.email;

    let rest = await DBA.execQuery(DBSTATEMENT.customer_data, email)

    if (rest[0]) {
        //saving customer_id for further use
        customer_id = rest[0].customer_id;
        console.log("customer id from customer login ", customer_id)

        let v = await BCRYPT.compareSync(req.body.password, rest[0].customer_password);
        if (v) {
            let token = await JWT.sign(email, SECRET_KEY)

            if (token) {
                res.json({
                    "status": 200,
                    "Message": 'login successfully',

                    "Data": {
                        Token: token, id: rest[0].customer_id, fname: rest[0].customer_fname, lname: rest[0].customer_lname, email: rest[0].customer_email, phone: rest[0].customer_phone,
                        customer_request: rest[0].customer_request, customer_task_over: rest[0].customer_task_over
                    }
                });
            }
            else {
                res.json({
                    "status_code": 400,
                    "error": "Bad Request",
                    "message": "Token Generation Error"
                });
            }
        }
        else {
            res.json({
                "status_code": 400,
                "error": "Bad Request",
                "message": "Password Not Matched"
            })
        }

    }

    else {
        console.log('error last')
        res.json({
            "status_code": 400,
            "Error": "Bad Request",
            "Message": "Email Do Not Exist"
        })
    }
}
/************Verify Customer *
exports.verify_customer = function(req,res,next){
    let token;
     token = req.body.token;

    JWT.verify(token,SECRET_KEY, function (err, decoded) {
        if (err)
        {
        console.log("err]]]]",err)
            res.json({
                "status_code": 400,
                "error": "Unauthorized",
                "message": "Token Invalid"
            })
        }
            else {
            email = decoded;
            next();
        }
    })
}

/***********CUSTOMER BOOKING *
let booking_id;

exports.get_customer_id = async (req, res, next) => {
    try {
    customer_id = await DBA.execQuery(DBSTATEMENT.get_customer_id, email)
     }
     catch(err){
            res.json({
                "status_code": 400,
                "error": "Cannot get Customer_Id",
                "message": err.Message
            })
        }
    finally{
        next();
    }

    console.log("Customer_id +++++++++ ", customer_id[0].customer_id)
}

/**************CUSTOMER BOOKING *

exports.book = async function(req, res, next){
    let obj = [customer_id[0].customer_id, req.body.source_lat, req.body.source_long, req.body.dest_lat, req.body.dest_long]

    console.log("Object ;++++++ ;", obj);
    let rest;

    rest = await DBA.execQuery(DBSTATEMENT.book, obj, function (err) {
        if (err) {
            console.log("error section ")
            res.json({
                "status_code": 400,
                "error": "Booking Not Placed",
                "message": err.message
            })
        }
    })
    console.log("rest ++++-------", rest)
    if (rest) {
        booking_id = rest.insertId;
        res.json({
            "status_code": 200,
            "message" : "Booking Successfully Placed But Not Confirmed",
            "data" : rest
        })
    }
}

/**************GET all customer booking

exports.get_all_bookings = function(req,res,next){
    Promise.coroutine(function*(){
        console.log("customer_id")
        return  yield DBA.execQuery(DBSTATEMENT.get_all_bookings,[customer_id]);
       })().then ((value)=>{
           if(value){
               res.json({
                   "status_code":200,
                   "message":"list of all bookings",
                   "data" : value
               })
           }
               else
               {
                   res.json({
                       "status_code":400,
                       "message":"Error in getting list of all the bookings",
                       "data" : value
                   })
               }
           })

}
/***************UPDATE BOOKING CUSTOMER
exports.update_booking_customer = async (req, res, next)=>{
  console.log("hit made")
    let rest = await DBA.execQuery(DBSTATEMENT.update_booking_customer,[1,customer_id[0].customer_id],function(err){
        if(err)
        {
            res.json({
                "status_code" : 400,
                "error": "Booking placement error",
                "Message" : err.message
            })
        }
    })

    console.log("hit rest ++++++ ",rest)
    if(rest)
    {
        console.log("update booking customer ++++ ",rest)
    }
}*/

////////////////DRIVER HANDLER////////////
//let driver_id = 0;

/*******DRIVER ALREADY REGISTERED ********
exports.driver_is_already_registered = async (req, res, next) => {
    let email = req.body.email;

    let rest = await DBA.execQuery(DBSTATEMENT.driver_data, email)

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

/*************DRIVER SIGNUP ******
exports.driver_signup = async (req, res, next) => {
    let salt = BCRYPT.genSaltSync(10);
    let password = BCRYPT.hashSync(req.body.password, salt);
    let obj = [req.body.fname, req.body.lname, 1, req.body.email, password, req.body.phone];
    console.log("In sign up function")

    let rest = await DBA.execQuery(DBSTATEMENT.driver_signup, obj)
    console.log("rest ++++++", rest);
    if (rest) {
        console.log("Rest ++++ ", rest)
        let data = { User_Id: rest.insertId, firstname: obj[0], lastname: obj[1], email: obj[3], phone: obj[5] };


        res.json({
            "status": 201,
            "Message": 'Registered successfully',
            "Data": rest.insertId
        });
    }
    else {
        res.json({
            "status": 400,
            "Message": 'Invalid Username or Password',
            "ERROR": rest.ERROR
        });
    }
}

/************DRIVER login ********
exports.driver_login = async (req, res, next) => {
    let email = req.body.email;

    let rest = await DBA.execQuery(DBSTATEMENT.driver_data, email)

    if (rest[0]) {
        let v = await BCRYPT.compareSync(req.body.password, rest[0].driver_password);
        if (v) {
            let token = await JWT.sign(email, SECRET_KEY)

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
        else {
            res.json({
                "status_code": 400,
                "message": "Password Not Matched",
                "data": "Bad Request"
            })
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

/******Driver Task Completion *
exports.verify_driver = async function(req, res,next){
    let email
    let token = req.body.token

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

        try{
        driver_id = await DBA.execQuery(DBSTATEMENT.get_driver_id, email)
           }

          catch(err)
          {
          if (err) {
                res.json({
                    "status_code": 400,
                    "error": "Cannot get Customer_Id",
                    "message": err.Message
                })
            }
        }
        if(driver_id)
            {
                console.log("driver_id _---",driver_id)
                next();
            }
     }



/***********Driver update task complete in booking table *
exports.request_completed = function (req, res,next){
    Promise.coroutine(function*(){
 return  yield DBA.execQuery(DBSTATEMENT.request_completed,[driver_id[0].driver_id]);
})().then ((value)=>{
    if(value){
       next();
    }
        else
        {
            res.json({
                "status_code":400,
                "message":"cannot update task_completed",
                "data" : value
            })
        }
    })
}

/*********Update Driver available*
exports.updating_driver_available = function(req,res,next){
    console.log("updating drivers portion ")
    Promise.coroutine(function*(){
        return  yield DBA.execQuery(DBSTATEMENT.update_driver_available,[1,0,driver_id[0].driver_id]);
       })().then ((value)=>{
           if(value){
               res.json({
                   "status_code":200,
                   "message": "task completed successfully",
                   "data":value
               })
           }
               else
               {
                   res.json({
                       "status_code":400,
                       "message":"Error in updating driver table",
                       "data" : value
                   })
               }
           })
       }


/***********Driver view assigned customer *
exports.list_of_assigned_customers = function(req, res, next){
    Promise.coroutine(function*(){
        return  yield DBA.execQuery(DBSTATEMENT.assigned_customers,[driver_id[0].driver_id]);
       })().then ((value)=>{
           if(value){
               res.json({
                   "status_code":200,
                   "message":"list of the asssigned customers",
                   "data" : value
               })
           }
               else
               {
                   res.json({
                       "status_code":400,
                       "message":"Error in getting customer list",
                       "data" : value
                   })
               }
           })
}
*/