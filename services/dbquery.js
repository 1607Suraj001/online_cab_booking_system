//****************** Queries for admin table
exports.signup = 'INSERT INTO `admin` (`admin_id`,`admin_fname`,`admin_lname`,`admin_email`,`admin_password`,`admin_phone`) VALUES (NULL,?,?,?,?,?)'

exports.admin_data = 'SELECT `admin_id`,`admin_fname`,`admin_lname`,`admin_phone`,`admin_email`,`admin_password` FROM `admin` WHERE admin_email = ?'

exports.all_admin_data = 'SELECT `admin_id`,`admin_fname`,`admin_lname`,`admin_phone`,`admin_email` FROM `admin`'

exports.verify_admin = 'SELECT `admin_id` FROM `admin` WHERE admin_email = ?'

exports.update_driver_available = 'UPDATE `driver` SET `driver_available` = ?,`driver_current_status`=? WHERE `driver_id`=? '
//****************** Queries for customer table
exports.customer_signup = 'INSERT INTO `customer` (`customer_id`,`customer_fname`,`customer_lname`,`customer_email`,`customer_password`,`customer_phone`) VALUES (NULL,?,?,?,?,?)'

exports.customer_data = 'SELECT * FROM `customer` WHERE customer_email = ?'

exports.customer_data_view = 'SELECT `customer_id`,`customer_fname`,`customer_lname`,`customer_request`,`customer_task_over`,`customer_phone` FROM `customer` WHERE customer_email = ?'

exports.get_customer_id = 'SELECT `customer_id` FROM `customer` WHERE customer_email = ?'

exports.update_booking_customer = 'UPDATE `customer` SET `customer_request` = ? WHERE `customer_id` = ?' 

exports.get_all_confirmed_bookings = 'SELECT `booking_id`,`driver_fname`,`driver_lname`,`source_lat`,`source_long`,`dest_lat`,`dest_long` FROM `customer` AS `c`,`driver` AS `d`,`booking` AS `b` WHERE c.customer_id = b.customer_id AND d.driver_id = b.driver_id AND b.booking_id = d.driver_current_status AND c.customer_id = ?'

exports.get_all_pending_bookings= 'SELECT `booking_id`,`source_lat`,`source_long`,`dest_lat`,`dest_long` FROM `customer` AS `c`, `booking` AS `b` WHERE b.customer_id = ? AND c.customer_id = b.customer_id AND  b.driver_id IS NULL' 

exports.get_date = 'SELECT `booking_id`,`driver_id`,`source_lat`,`source_long`,`dest_lat`,`dest_long`,`request_history` FROM `booking` WHERE customer_id= ?   '

exports.check_service_available = `set @r = GeomFromText("POLYGON((30.725471 76.675637,30.662898 76.735002,30.726582 76.827737,30.780039 76.783146,30.725471 76.675637))");set @p = GeomFromText("POINT(? ?)");select if(contains(@r, @p),'no','yes');`

exports.get_nearest_driver = 'SELECT DISTINCT  driver.driver_id ,booking.customer_id,MIN((SELECT ( 3959 * acos( cos( radians(X(driver.driver_location)) ) * cos( radians(booking.source_lat) ) ) * cos( radians(Y(driver.driver_location))) - radians(booking.source_long)) + sin(radians(X(driver.driver_location))) * sin( radians(booking.source_lat)) ))AS distance FROM `driver`,`booking` WHERE driver.driver_available = ? AND booking.customer_id = ? ORDER BY distance ASC ;'

//******************  Queries for driver table
exports.driver_data = 'SELECT * FROM `driver` WHERE driver_email = ?'

exports.driver_signup = 'INSERT INTO `driver` ( `driver_id`,`driver_fname`,`driver_lname`,`driver_available`,`driver_current_status`,`driver_email`,`driver_password`,`driver_phone`) VALUES (NULL,?,?,?,NULL,?,?,?)'

exports.get_driver_id ='SELECT `driver_id`,`driver_current_status` FROM `driver` WHERE driver_email = ?'

exports.already_assigned_or_not = 'SELECT `driver_available` FROM `driver` WHERE `driver_id` = ?'

exports.get_driver_email = 'SELECT `driver_email` FROM `driver` WHERE `driver_id` = ?'

exports.get_booking_id= 'SELECT `booking_id` FROM `booking` WHERE `driver_id` = ?'
//*****************  Queries on booking table can oly be accessed by the admin

//Inserting into booking
exports.book = 'INSERT INTO `booking` (`booking_id`,`booking_type`,`customer_id`,`driver_id`,`source_lat`,`source_long`,`dest_lat`,`dest_long`,`request_pending`,`request_completed`) VALUES(NULL,?,?,NULL,?,?,?,?,1,0)'

// getting booking_id  to whom No Driver is assigned 
exports.get_pending_requests = 'SELECT `booking_id` FROM `booking` WHERE `request_pending` = ?'

//getting available drivers
exports.get_available_drivers = 'SELECT `driver_id` FROM `driver` WHERE `driver_available` = ?'

//get customer id 
exports.get_customer_id_from_booking = 'SELECT `customer_id` FROM `booking` WHERE `booking_id` = ?'

//assign driver 
exports.assign_driver = 'UPDATE `booking` SET `driver_id` = ?,`request_pending` = ?,`driver_assigning_time`= NOW(),`driver_assigning_admin_id` = ? WHERE `booking_id` = ?'

//update task completion 
exports.request_completed = 'UPDATE `booking` SET `request_completed` = NOW()  WHERE `driver_id`=? AND `booking_id`=? AND request_completed IS NULL'

//get request_pending
exports.check_whether_request_pending = 'SELECT `request_pending` from `booking` WHERE `booking_id`=?'

//get curernt driver of the pending request
exports.get_current_assigned_driver_id = 'SELECT `driver_id` FROM `booking` WHERE booking_id = ?'

exports.put_log = 'SELECT `booking_id`,`driver_fname`,`driver_lname`,`source_lat`,`source_long`,`dest_lat`,`dest_long`,`driver_assigning_time`,`request_completed`,`request_history`,`driver_phone`,`driver_email` FROM `driver`,`booking` WHERE booking.booking_id = ? AND driver.driver_id = booking.driver_id'
//JOINS ++++++++++

//list of the assigned customers 
exports.assigned_customers = 'SELECT `booking_id`,`customer_fname`,`customer_lname`,`customer_email`,`customer_phone`,`source_lat`,`source_long`,`dest_lat`,`dest_long`,`driver_assigning_time` FROM `booking` INNER JOIN `customer` ON customer.customer_id = booking.customer_id WHERE booking.driver_id = ? AND booking.request_completed IS NULL'

//list of task completed drivers

//exports.request_completed_drivers =
/**************Queries for Customer payment Table  */
exports.get_customer_id_from_customer_payment = 'SELECT `customer_id` from `customer_payment` WHERE customer_id = ?'

exports.create_customer_payment_dashboard = 'INSERT INTO `customer_payment` (`customer_id`,`customer_gateway`,`customer_gateway_creation_time`) VALUES (?,?,?)'

exports.get_customer_gateway  = 'SELECT `customer_gateway` from `customer_payment` WHERE customer_id = ?'

exports.store_customer_card = 'INSERT INTO `customer_cards` (customer_id,customer_card_id,customer_card_object,customer_card_exp_month,customer_card_exp_year,customer_fingerprint,customer_funding,customer_card_last4) VALUES (?,?,?,?,?,?,?,?)'

// joins 

exports.get_booking_and_customer_details = 'SELECT * from `booking` LEFT JOIN `customer` ON booking.customer_id = customer.customer_id WHERE booking.booking_id = ?'

exports.get_customer_card = 'SELECT customer_card_id from `customer_cards` where customer_id = ?'