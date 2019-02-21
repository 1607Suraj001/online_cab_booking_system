
var MongoClient = require('mongodb').MongoClient;

var url = "mongodb://localhost:27017/my_database";

exports.create_database = function(req,res,next){
    MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created Mongo Database Started!");
  db.close();
});
}
