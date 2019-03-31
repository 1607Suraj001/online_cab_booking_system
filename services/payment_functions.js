const STRIPE = require("stripe")("sk_test_VKx3WB88ZMtNTt9LOueZcvhz00Rnplefkz");


exports.generate_card_token = function(req,res){
  return new Promise (function(resolve,reject){
     let card_token;
    // generating token 
    let card_number = req.query.number;
    let card_exp_month = req.query.exp_month;
    let card_exp_year = req.query.exp_year; 
    let card_cvc = req.query.cvc;

    STRIPE.tokens.create({
       card: {
         number: card_number,
         exp_month:card_exp_month ,
         exp_year: card_exp_year,
         cvc: req.body.cvc
       }
     }, function(err, token) {
       // asynchronously called    

       if(err){
        reject(err)
       }
       else{
         card_token = token;
         console.log("Card Token generated : ",token)
           resolve(token);
        }
     });
    })
  }