const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/upload');

const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');
const db = require("../models")
const Op = db.Sequelize.Op;
const { v4: uuidv4 } = require('uuid');

router.get('/facalltraineeappointment', ensureAuthenticated, async function(req, res) {
    
    const config = await db.Config.findAll({})
    var dateString = new Date();
    dateString.setDate(dateString.getDate() - 1);
    
    var currentDate  = dateString.toISOString().replace(/T/, ' ').replace(/\..+/, '');
   
    const [trainee,metadata] =await db.sequelize.query("SELECT * "+
  "  FROM Appointments "+
  "  INNER JOIN Trainees ON Trainees.uniqueid = Appointments.trainee_id "+
  " WHERE Appointments.appointment_date > '"+ currentDate +"'");
  console.log(trainee)
    res.render('facalltraineeappointment',{config:config,trainee:trainee,user:req.user});
   
  });
  router.get('/facalltrainerappointment', ensureAuthenticated, async function(req, res) {
   
    var dateString = new Date();
    dateString.setDate(dateString.getDate() - 1);
    
    var currentDate  = dateString.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const config = await db.Config.findAll({})
    const [trainee,metadata] =await db.sequelize.query("SELECT * "+
  "  FROM Appointments "+
  "  INNER JOIN TraineeTrainers ON TraineeTrainers.uniqueid = Appointments.trainee_id "+
  " WHERE Appointments.appointment_date > '"+ currentDate +"'");
    res.render('facalltrainerappointment',{trainee:trainee,user:req.user,config:config});
  }); 
  
  router.post('/updatetraineetestcode',ensureAuthenticated,async function(req,res){
    const {actiontag,traineeid,appointmentdate,traineetestcode} = req.body;
    let errors =[]
    var dateString = new Date();
    dateString.setDate(dateString.getDate() - 1);

    var currentDate  = dateString.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const config = await db.Config.findAll({})
    const [trainee,metadata] =await db.sequelize.query("SELECT * "+
  "  FROM Appointments "+
  "  INNER JOIN Trainees ON Trainees.uniqueid = Appointments.trainee_id "+
  " WHERE Appointments.appointment_date > '"+ currentDate +"'");
    if(!actiontag || !traineeid || !appointmentdate ||!traineetestcode){
     errors.push({msg:'Please Enter Test Code'})
    }
    if(errors.length >0){
        if(actiontag === 'Trainer'){
            res.render('facalltrainerappointment',{errors,trainee:trainee,user:req.user,config:config});

        }else{
            res.render('facalltrainerappointment',{errors,trainee:trainee,user:req.user,config:config});

        }
    }else{
        const traineetestcodedata = {
            trainee_id: traineeid,
          appointment_date: new Date(appointmentdate),
          test_code: traineetestcode
        };
        console.log(traineetestcodedata)
        var currentDate = new Date();
        db.PracticalMark.findOne({where:{ trainee_id:traineeid,testcode:traineetestcode}}).
        then(mark =>{
        if(mark){
          res.render('facalltrainerappointment',{error_msg:'You Already Set  Test Code  For This Trainee For Today Examination!',trainee:trainee,user:req.user,config:config});
    
        }else{
          db.TraineeTestCode.findAll({where:{createdAt:{
            [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
            [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
       
          },test_code:traineetestcode}}).then(existedcode =>{
            console.log(existedcode)
          if(existedcode.length ===0){
            db.TraineeTestCode.findAll({where:{createdAt:{
              [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
              [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
         
            },  trainee_id: traineeid}}).then(traineeontestcode =>{
               if(traineeontestcode.length ===0){
                db.TraineeTestCode.create(traineetestcodedata).then(testcode =>{

                  if(actiontag === 'Trainer'){
  
                      res.render('facalltrainerappointment',{success_msg:'Trainee Test Code Setted Successfully.Test Can Start Now!',trainee:trainee,user:req.user,config:config});
          
                  }else{
                      res.render('facalltrainerappointment',{success_msg:'Trainee Test Code Setted Successfully.Test Can Start Now!',trainee:trainee,user:req.user,config:config});
          
                  }
              }).catch(err =>{
              console.log(err)
              })
               }else{
                res.render('facalltrainerappointment',{error_msg:'You Already Set  Test Code  For This Trainee For Today Examination!',trainee:trainee,user:req.user,config:config});
    
               }
            })
           
          
          }else{
            if(actiontag === 'Trainer'){

                res.render('facalltrainerappointment',{error_msg:'Trainee Test Code Already Setted For Today Examination!',trainee:trainee,user:req.user,config:config});
    
            }else{
                res.render('facalltrainerappointment',{error_msg:'Trainee Test Code Already Setted For Today Examination',trainee:trainee,user:req.user,config:config});
    
            }
          }
        }).catch(err =>{
            console.log(err)

        })
      
        }

        }).catch(err =>{
    
        })
  
       

    }
  })
  router.get('/factodaytraineetestcodelist', ensureAuthenticated, async function(req, res) {
    
    const config = await db.Config.findAll({})
    var dateString = new Date();
    dateString.setDate(dateString.getDate() - 1);
    
    var currentDate  = dateString.toISOString().replace(/T/, ' ').replace(/\..+/, '');
   
    const [trainee,metadata] =await db.sequelize.query("SELECT * "+
  "  FROM TraineeTestCodes "+
  "  INNER JOIN Trainees ON Trainees.uniqueid = TraineeTestCodes.trainee_id "+
  " WHERE TraineeTestCodes.createdAt > '"+ currentDate +"'");

  const [trainer,metadatatr] =await db.sequelize.query("SELECT * "+
  "  FROM TraineeTestCodes "+
  "  INNER JOIN TraineeTrainers ON TraineeTrainers.uniqueid = TraineeTestCodes.trainee_id "+
  " WHERE TraineeTestCodes.createdAt > '"+ currentDate +"'");
 
    res.render('factodaytraineetestcodelist',{trainer:trainer,config:config,trainee:trainee,user:req.user});
   
  });
  router.get('/help',ensureAuthenticated,async function(req,res){
    res.render('help',{user:req.user})
 })
  module.exports = router;