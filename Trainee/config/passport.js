
const LocalStrategy = require('passport-local').Strategy;

const bcrypt = require('bcryptjs');
const { response } = require('express');
const axios = require('axios');

const db = require("../models")
const Op = db.Sequelize.Op;
var existeduser;

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'registercode' }, (registercode, password, done) => {
      // Match user
      db.Trainee.findOne({  where: {
        [Op.and]: [
            {
              trainee_code: registercode
            }, 
        
            {
              pass_fail: 'FAIL'
            }
        ],
        is_active:'Yes'
    }}).then(data => {
      console.log(data)
        if(!data)
        {
            return done(null,false,{ message: 'Invalid Credential' });
        }
     //   const isValid=validPassword(password,results[0].hash,results[0].salt);
     existeduser={userid:data.id,username:data.username,password:data.password,licence_type:data.licence_type,
      gender:data.gender,age:data.age
      };
     console.log(data);
        bcrypt.compare(password, existeduser.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, existeduser);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
    });
    
    })


  );


  passport.serializeUser(function(existeduser, done) {
    done(null, existeduser.userid);
  });

  passport.deserializeUser(function(userid, done) {
    db.Trainee.findOne({where:{id:userid}}).then(data => {
      done(null, data);    
});
  });

};