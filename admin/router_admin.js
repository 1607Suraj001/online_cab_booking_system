const EXPRESS = require('express')
const VALIDATOR = require('../validators/validator.js')
const BODYPARSER = require('body-parser')
const ROUTE = require('./admin_controller.js')

const ROUTER = EXPRESS.Router();

ROUTER.use(BODYPARSER.json());
ROUTER.use(BODYPARSER.urlencoded({extended : true}))

/*********USER API */
ROUTER.post('/signup',VALIDATOR.signup,ROUTE.is_already_registered,ROUTE.signup)
ROUTER.get('/login',VALIDATOR.login, ROUTE.login);
ROUTER.get('/view_all_admin',ROUTE.verify_admin,ROUTE.view_all_admin)
ROUTER.get('/get_pending_requests',ROUTE.verify_admin,ROUTE.get_pending_requests)
ROUTER.get('/get_available_drivers',ROUTE.verify_admin,ROUTE.get_available_drivers)
ROUTER.put('/assign_driver',ROUTE.verify_admin/*,ROUTE.save_in_redis*/,ROUTE.update_driver_available,ROUTE.assign_driver,ROUTE.send_email_to_driver)
ROUTER.get('/get_logs_particular',ROUTE.verify_admin,ROUTE.get_logs_particular)
ROUTER.get('/requests_of_a_particular_customer',ROUTE.verify_admin,ROUTE.get_request_made_by_customer_on_a_particular_date)
ROUTER.get('/get_redis_details',ROUTE.redis_details)
//ROUTER.get('/completed_requests',ROUTE.verify_admin,ROUTE.request_completed) 
module.exports = ROUTER;
