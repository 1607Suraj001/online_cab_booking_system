//****************** Queries for admin table
exports.signup = 'INSERT INTO `admin` (`admin_id`,`admin_fname`,`admin_lname`,`admin_email`,`admin_password`,`admin_phone`) VALUES (NULL,?,?,?,?,?)'

exports.admin_data = 'SELECT * FROM `admin` WHERE admin_email = ?'

exports.all_admin_data = 'SELECT `admin_id`,`admin_fname`,`admin_lname`,`admin_phone`,`admin_email` FROM `admin`'

exports.verify_admin = 'SELECT `admin_id` FROM `admin` WHERE admin_email = ?'

exports.update_driver_available = 'UPDATE `driver` SET `driver_available` = ?,`driver_current_status`=? WHERE `driver_id`=? '
//****************** Queries for customer table
exports.customer_signup = 'INSERT INTO `customer` (`customer_id`,`customer_fname`,`customer_lname`,`customer_email`,`customer_password`,`customer_phone`,`customer_history`) VALUES (NULL,?,?,?,?,?,NULL)'

exports.customer_data = 'SELECT * FROM `customer` WHERE customer_email = ?'

exports.customer_data_view = 'SELECT `customer_id`,`customer_fname`,`customer_lname`,`customer_request`,`customer_task_over`,`customer_phone` FROM `customer` WHERE customer_email = ?'

exports.get_customer_id = 'SELECT `customer_id` FROM `customer` WHERE customer_email = ?'

exports.update_booking_customer = 'UPDATE `customer` SET `customer_request` = ? WHERE `customer_id` = ?' 

exports.get_all_confirmed_bookings = 'SELECT `booking_id`,`driver_fname`,`driver_lname`,`source_lat`,`source_long`,`dest_lat`,`dest_long` FROM `customer` AS `c`,`driver` AS `d`,`booking` AS `b` WHERE c.customer_id = b.customer_id AND d.driver_id = b.driver_id AND b.booking_id = d.driver_current_status AND c.customer_id = ?'

exports.get_all_pending_bookings= 'SELECT `booking_id`,`source_lat`,`source_long`,`dest_lat`,`dest_long` FROM `customer` AS `c`, `booking` AS `b` WHERE b.customer_id = ? AND c.customer_id = b.customer_id AND  b.driver_id IS NULL' 
//******************  Queries for driver table
exports.driver_data = 'SELECT * FROM `driver` WHERE driver_email = ?'

exports.driver_signup = 'INSERT INTO `driver` ( `driver_id`,`driver_fname`,`driver_lname`,`driver_available`,`driver_current_status`,`driver_email`,`driver_password`,`driver_phone`,`driver_history`) VALUES (NULL,?,?,?,NULL,?,?,?,NULL)'

exports.get_driver_id ='SELECT `driver_id`,`driver_current_status` FROM `driver` WHERE driver_email = ?'

exports.already_assigned_or_not = 'SELECT `driver_available` FROM `driver` WHERE `driver_id` = ?'
//*****************  Queries on booking table can oly be accessed by the admin

//Inserting into booking
exports.book = 'INSERT INTO `booking` (`booking_id`,`customer_id`,`driver_id`,`source_lat`,`source_long`,`dest_lat`,`dest_long`,`request_pending`,`request_completed`,`request_history`) VALUES(NULL,?,NULL,?,?,?,?,1,NULL,NULL)'

// getting booking_id  to whom No Driver is assigned 
exports.get_pending_requests = 'SELECT `booking_id` FROM `booking` WHERE `request_pending` = ?'

//getting available drivers
exports.get_available_drivers = 'SELECT `driver_id` FROM `driver` WHERE `driver_available` = ?'

//assign driver 
exports.assign_driver = 'UPDATE `booking` SET `driver_id` = ?,`request_pending` = ?,`driver_assigning_time`= NOW() WHERE `booking_id` = ?'

//update task completion 
exports.request_completed = 'UPDATE `booking` SET `request_completed` = NOW()  WHERE `driver_id`=? AND `booking_id`=? AND request_completed IS NULL'

//get request_pending
exports.check_whether_request_pending = 'SELECT `request_pending` from `booking` WHERE `booking_id`=?'

//get curernt driver of the pending request
exports.get_current_assigned_driver_id = 'SELECT `driver_id` FROM `booking` WHERE booking_id = ?'

exports.put_log = 'SELECT `booking_id`,`driver_fname`,`driver_lname`,`source_lat`,`source_long`,`dest_lat`,`dest_long`,`driver_assigning_time`,`request_completed`,`request_history`,`driver_phone`,`driver_email` FROM `driver`,`booking` WHERE booking.booking_id = ? AND driver.driver_id = booking.driver_id'
//JOINS ++++++++++

//list of the assigned customers 
exports.assigned_customers = 'SELECT `booking_id`,`customer_fname`,`customer_lname`,`customer_email`,`customer_phone`,`source_lat`,`source_long`,`dest_lat`,`dest_long`,`driver_assigning_time` FROM `customer` INNER JOIN `booking` ON customer.customer_id = booking.customer_id WHERE booking.driver_id = ? AND booking.request_completed IS NULL'

//list of task completed drivers

//exports.request_completed_drivers =
