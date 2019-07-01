const BCRYPT = require('bcryptjs')
const JWT = require('jsonwebtoken')
const DBSTATEMENT = require('../services/dbquery.js')
const DBA = require('../services/libs.js')
const Promise = require('bluebird')
const SECRET_KEY = '1234@abcd';
const response = require('../services/responses')
const NODEMAILER = require('nodemailer')
const REDIS = require('redis');


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
let customer_id
let admin_id

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
        response.bad_request(res, err)
        res.json({
            "status_code": 400,
            "error": err.name,
            "message": err.message
        })
    }
    finally {
        if (rest) {
            let data = { User_Id: rest.insertId, firstname: obj[0], lastname: obj[1], email: obj[2], phone: obj[4] };

            response.success(res, "Registered succesfully", data)
        }
        else {
            response.bad_success(res, rest, "Invalid Username or Password")

        }
    }
}

/************* Checking Admin Already */
exports.is_already_registered = async (req, res, next) => {
    let email = req.body.email;

    let rest = await DBA.execQuery(DBSTATEMENT.admin_data, email)

    if (rest) {
        if (rest.length) {
            response.error(res, "Bad Request", "User Already Registered")

        }
        else {
            next();
        }
    }
}

/*********logging in user & Generating token */
exports.login = async (req, res, next) => {
    let email = req.query.email;
    console.log('Email +++ ', email)

    let rest = await DBA.execQuery(DBSTATEMENT.admin_data, email)

    if (rest[0]) {
        let v = await BCRYPT.compareSync(req.query.password, rest[0].admin_password);
        console.log()
        if (v) {
            let token = await JWT.sign(email, SECRET_KEY)
                
            if (token) {
                res.json({
                    "status_code": 200,
                    "Message": 'login successfully',
                    "Data": { Token: token, id: rest[0].admin_id, fname: rest[0].admin_fname, lname: rest[0].admin_lname, email: rest[0].admin_email, phone: rest[0].admin_phone }
                });
            }
            else {
                response.error(res, "Bad Request", "Token Generation Error")
            }
        }
        else {
            response.error(res, "Bad Request", "Password Not Matched")
        }

    }

    else {
        console.log('error last')
        response.error(res, "Bad Request", "Email Do Not Exist")
    }
}

/**************Verify admin */
exports.verify_admin = async function (req, res, next) {
    console.log("verify_admin")
    JWT.verify(req.query.token, SECRET_KEY, function (err, decoded) {
        if (err)
            response.bad_request(res, err)
        else {
            email = decoded;
        }
    })

    if (email) {
        try {
            let rest = await DBA.execQuery(DBSTATEMENT.admin_data, email)
            admin_id = rest[0].admin_id
        }
        catch (err) {
            response.bad_success(res, err, "User Not Admin")
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
            response.success(res, "list of the admin", value)

        }
        else {
            response.error(res, value, "Error in getting admin list")
        }
    })

}


/**********Getting details of the pending request******/
exports.get_pending_requests = async (req, res, next) => {
    let email;
    let data;
    JWT.verify(req.query.token, SECRET_KEY, function (err, decoded) {
        if (err) {
            response.error(res, err.message, "Unauthorised")
        }
        else {
            email = decoded;
        }
    })
    // Verify admin or not
    let rest = await DBA.execQuery(DBSTATEMENT.verify_admin, email, function (err) {
        if (err)
            response.error(res, err.name, err.message)
    })
    if (rest) {
        // get all pending details 
        try {
            data = await DBA.execQuery(DBSTATEMENT.get_pending_requests, 1)
        }
        catch (err) {
            response.error(res, err.message, "Pending Requests Not Found")
        }

        console.log('right now ++++ ', data)
        if (data) {
            response.success(res, "List od pending requests", data)
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
    catch(err){
        if (err)
            response.error(res, "Error in getting available drivers", err.message)
    }

    if (rest) {
        response.success(res, "List of the available drivers", rest)
    }
}

////////////// Assign Driver update booking table 
exports.assign_driver = async (req, res,next) => {
    try {
        available_driver = req.body.available_drivers;
        booking_id = req.body.booking_id;
        console.log("adasd ,, dad", available_driver, booking_id)

        console.log("admin_id **** ", admin_id)
        //checking whether resquest pending or not , if pending then assign driver independently otherwise free current driver 
        let data = await DBA.execQuery(DBSTATEMENT.check_whether_request_pending, [booking_id])
        console.log("data 0000", data[0].request_pending)
        if (data[0].request_pending === 1) {
            console.log("Admin_id ---", admin_id)
            rest = await DBA.execQuery(DBSTATEMENT.assign_driver, [available_driver, 0, admin_id, booking_id])
        }
        else {  //case when request is being hold by another driver

            console.log("Admin_id ---->>", admin_id)
            //getting current driver_id which is assigned to pending  request
            let data = await DBA.execQuery(DBSTATEMENT.get_current_assigned_driver_id, [booking_id])

            //assign new dreiver to pending request
            rest = await DBA.execQuery(DBSTATEMENT.assign_driver, [available_driver, 0, admin_id, booking_id])

            //update the row in driver_id of old driver
            rest = await DBA.execQuery(DBSTATEMENT.update_driver_available, [1, null, data[0].driver_id])
        }
    }

    catch (err) {
        console.log("lasr rest +++++===", rest)
        response.error(res, err.name, err.message)
    }
    finally {
        if (rest.changedRows === 1) {
            response.success(res, "Driver Successfully assigned and Booking Confirmed", {})
            next()
        }
        else {
            response.error(res, "Driver Not Assigned", "Internal Error")
        }
    }
}
/************Update Driver Avilable */
exports.update_driver_available = async (req, res, next) => {
    let rest
    let available_driver = req.body.available_drivers;
    let booking_id = req.body.booking_id;
    console.log("available drivers , bookingid", available_driver, booking_id)
    try {
        try {
            rest = await DBA.execQuery(DBSTATEMENT.already_assigned_or_not, [available_driver])
        }
        catch (err) {
            response.error(res, err.name, err.message)
        }
        finally {
            console.log("rest ----- )))", rest)

            if (rest[0].driver_available === 1)
                rest = await DBA.execQuery(DBSTATEMENT.update_driver_available, [0, booking_id, available_driver])
            else {
                console.log
                console.log("Driver already assigned cannot reassign a busy driver")
                response.error(res, "Driver already assigned to another booking", "Assign a free driver")

            }
        }
    }
    catch (err) {
        console.log("ERROR ", err)
        response.error(res, "Error in assigning booking to driver", err.message)

    }
    finally {
        console.log("rest -----", rest)
        if (rest.changedRows === 1) {
            next();
        }
    }
}

/*************** Get customer logs*/
exports.get_logs = function (req, res) {
    Promise.coroutine(function* () {
        return yield DBA.execQuery(DBSTATEMENT.get_booking_data, booking_id);
    })().then((value) => {
        if (value) {
            response.sucess(res, "List of the admin", value)
        }
        else {
            response.error(res, "Error in getting admin list", value)

        }
    })

}

/**************Save in redis */
exports.save_in_redis = async function (req,res,next){
  
    let CLIENT = REDIS.createClient();
     available_driver = req.body.available_drivers;
     booking_id = req.body.booking_id;

     try{
         customer_id = await DBA.execQuery(DBSTATEMENT.get_customer_id_from_booking,booking_id)
     }
     catch(err)
     {
         responses.error(res,err)
     }
     finally{
CLIENT.on('error', function(err){
    console.log('Something went wrong ', err)
  });

CLIENT.hset(booking_id, 'driver_id', available_driver, REDIS.print);
CLIENT.hset(booking_id, 'customer_id', customer_id[0].customer_id, REDIS.print);
CLIENT.hset(booking_id, 'admin_id',admin_id,REDIS.print);

CLIENT.hgetall(booking_id, function(err, result) {
  console.log("REDIS DATA STORED :: ",JSON.stringify(result)); // {"key":"value","second key":"second value"}
});

next();
     }
}
/***** Get booking details from redis  */
exports.redis_details= function(req,res){
    
    let CLIENT = REDIS.createClient();
    booking_id = req.query.booking_id

    CLIENT.hgetall(booking_id, function(err, result) {
        console.log("REDIS DATA STORED :: ",JSON.stringify(result)); // {"key":"value","second key":"second value"}
        res.json({
            "status_code" : 200,
            "data" : result
        }) 
        });
}

/************Get logs */
exports.get_logs_particular = function (req, res) {
    try {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            let dbo = db.db("my_database");
            console.log(req.query.booking_id)
            let myobj = {
                "booking_id" : req.query.booking_id
            }
    

            let collection_name = "customer_logs";
            console.log("collection_name ***", collection_name)
            console.log("mmyobj )))--", myobj)
            new Promise(function(resolve,reject){
            dbo.collection(collection_name).findOne(myobj, function (err, result) {
                if (err) {
                 reject(err);
                }
                console.log("rrrrrrrrrrrrrrrrrr",result)
                if (result) {
                    console.log("ins second if", result)
                    response.success(res, "Booking Logs", result)            
                }
                else
                  console.log("eeeeeeeeeeeeeeeeee",err)
                    response.error(res, "No Records Found", result)
                })

        })
    })
}
    catch (err) {
        console.log("Error ::: ",err)
        response.error(res, err.name, err.message)
    }
    }



exports.get_request_made_by_customer_on_a_particular_date = async function (req, res) {
    let data;
    console.log("reached ..... ", email)
    try {
        customer_id = req.query.customer_id
        console.log("customer_id", customer_id)
        data = await DBA.execQuery(DBSTATEMENT.get_date, [customer_id])
    }
    catch (err) {
        response.error(res, err.name, err.message)
    }
    finally {
        response.success(res, "Booking List date", data)
    }
}

/*********Send Email to Driver  */
exports.send_email_to_driver = async (req, res, next) => {
    let available_driver_email;
    let details;

    console.log("password ))) ", req.body.password)
    let transporter = NODEMAILER.createTransport({
        service: 'gmail',
        auth: {
            user: email,
            pass: req.body.password
        }
    });

    try {
        console.log("Available_driver_id : ", req.body.available_drivers)
        available_driver_email = await DBA.execQuery(DBSTATEMENT.get_driver_email, req.body.available_drivers)
        console.log("Available _ driver _ email : ", available_driver_email)
    }
    catch (err) {
        response.error(res, err)
    }
    finally {
        console.log("Available_driver_email : ", available_driver_email)

        try {
            details = await DBA.execQuery(DBSTATEMENT.get_booking_and_customer_details, req.body.booking_id)
        }
        catch (err) {
            responses.error(res, err)
        }
        finally {
            console.log("Request Email , available_driver_email", email, available_driver_email[0].driver_email)
            let mailOptions = {
                from: email,
                to: available_driver_email[0].driver_email,
                subject: 'New Booking Assigned',
                text: JSON.stringify(details[0])
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    response.bad_request(res, error)
                }
                else {
                    console.log('Email sent: ' + info.response);
                    //response.success(res,info.response,info)
                }
            });
        }
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