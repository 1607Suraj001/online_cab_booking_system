const EXPRESS = require('express')
const VALIDATOR = require('../validators/validator.js')
const BODYPARSER = require('body-parser')
const ROUTE = require('./driver_controller.js')

const ROUTER = EXPRESS.Router();

ROUTER.use(BODYPARSER.json());
ROUTER.use(BODYPARSER.urlencoded({extended : true}))

/*********USER API */
ROUTER.post('/driver_signup',VALIDATOR.signup,ROUTE.driver_is_already_registered,ROUTE.driver_signup)
ROUTER.get('/login',VALIDATOR.login, ROUTE.driver_login);
ROUTER.post('/request_completed',ROUTE.verify_driver,ROUTE.request_completed,ROUTE.updating_driver_available,ROUTE.put_log)
ROUTER.get('/assigned_customers',ROUTE.verify_driver,ROUTE.list_of_assigned_customers)
module.exports = ROUTER;
