const express = require('express');
const router = express.Router();

const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const passport = require('passport');
const db = require("../models");
const path = require("path");
const Op = db.Sequelize.Op;
const { v4: uuidv4 } = require('uuid');
router.get('/', forwardAuthenticated, async (req, res) =>{
  res.render('index');
 });
 router.get('/dashboard', ensureAuthenticated, async function(req, res) {

    const alltrainee = await db.Trainee.count({  createdAt: {
      [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      [Op.lt]: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    }});
    const alltraineepayed = await db.Trainee.count({where:{is_payed:'Yes',  updatedAt: {
      [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      [Op.lt]: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    }}});
    const alltraineetakeexam = await db.Trainee.count({where:{  updatedAt: {
      [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      [Op.lt]: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    },
    attempt_count: {
      [Op.gt]: 0    }}});
      const batch = await  db.Batch.findAll();
      const batcha = await  db.Batch.findAll({where:{is_current:'Yes'}});
   const fail = await db.Trainee.count({where:{pass_fail:'FAIL'}});
   const pass = await db.Trainee.count({where:{pass_fail:'PASS'}});
   const passcounts = await db.Trainee.findAll({
    attributes: [
      [db.sequelize.literal('MONTH(createdAt)'), 'month'],
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
    ],
    where: {
      pass_fail: 'PASS',
      createdAt: {
        [Op.gte]: db.Sequelize.fn('DATE_SUB', db.Sequelize.fn('CURDATE'), db.Sequelize.literal('INTERVAL 11 MONTH'))
      }
    },
    group: [db.sequelize.literal('MONTH(createdAt)')],
    raw: true
  });
  
  const passarray = Array(12).fill(0);
  
  passcounts.forEach(count => {
    passarray[count.month - 1] = count.count;
  });
  const failcounts = await db.Trainee.findAll({
    attributes: [
      [db.sequelize.literal('MONTH(createdAt)'), 'month'],
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
    ],
    where: {
      pass_fail: 'FAIL',
      createdAt: {
        [Op.gte]: db.Sequelize.fn('DATE_SUB', db.Sequelize.fn('CURDATE'), db.Sequelize.literal('INTERVAL 11 MONTH'))
      }
    },
    group: [db.sequelize.literal('MONTH(createdAt)')],
    raw: true
  });
  
  const failarray = Array(12).fill(0);
  
  failcounts.forEach(count => {
    failarray[count.month - 1] = count.count;
  });
  const regcounts = await db.Trainee.findAll({
    attributes: [
      [db.sequelize.literal('MONTH(createdAt)'), 'month'],
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
    ],
    where: {
    
      createdAt: {
        [Op.gte]: db.Sequelize.fn('DATE_SUB', db.Sequelize.fn('CURDATE'), db.Sequelize.literal('INTERVAL 11 MONTH'))
      }
    },
    group: [db.sequelize.literal('MONTH(createdAt)')],
    raw: true
  });
  
  const regarray = Array(12).fill(0);
  
  regcounts.forEach(count => {
    regarray[count.month - 1] = count.count;
  });
  const examcounts = await db.Trainee.findAll({
    attributes: [
      [db.sequelize.literal('MONTH(createdAt)'), 'month'],
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
    ],
    where: {
      attempt_count: {
        [Op.gt]: 0    },
      createdAt: {
        [Op.gte]: db.Sequelize.fn('DATE_SUB', db.Sequelize.fn('CURDATE'), db.Sequelize.literal('INTERVAL 11 MONTH'))
      }
    },
    group: [db.sequelize.literal('MONTH(createdAt)')],
    raw: true
  });
  
  const examarray = Array(12).fill(0);
  
  examcounts.forEach(count => {
    examarray[count.month - 1] = count.count;
  });

  if(req.user.user_roll==="Admin"){
      res.render('dashboardoffice',{regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,pass:pass,fail:fail, alltrainee:alltrainee,alltraineepayed:alltraineepayed,alltraineetakeexam:alltraineetakeexam
        ,user:req.user});
    }else if(req.user.user_roll==="Department_Head"){
      res.render('dashboarddept',{regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray, pass:pass,fail:fail,alltrainee:alltrainee,
        alltraineepayed:alltraineepayed,
        alltraineetakeexam:alltraineetakeexam,batch:batch
        ,user:req.user});
    }else if (req.user.user_roll==="Assessor"){
      const [schedule,metadata] = await db.sequelize.query("Select * from Schedules "+
      " where Schedules.staff_id = '"+req.user.staffid +"'")
     console.log(schedule)
      res.render('dashboard',{schedule:schedule,user:req.user,batch:batcha});
    
    }else if(req.user.user_roll==="Facilitator"){
      const [schedule,metadata] = await db.sequelize.query("Select * from Appointments ")
     console.log(schedule)
      
      res.render('dashboardfacilitator',{pass:pass,fail:fail, alltrainee:alltrainee,alltraineepayed:alltraineepayed,alltraineetakeexam:alltraineetakeexam
        ,user:req.user});
    
    }else{
      res.render('pageerror');
    }
    
   });
   router.post('/selecttraineewithbatchname', ensureAuthenticated, async (req, res) =>{
    const{batchname,marklist} = req.body;
    let errors =[];
    const batch = await  db.Batch.findAll({where:{is_current:'Yes'}});
      const [schedule,metadatas] = await db.sequelize.query("Select * from Schedules "+
      " where Schedules.staff_id = '"+req.user.staffid +"'")
    if(!batchname || !marklist){
     errors.push({msg:'Please Select Required Fields'})
    }
    if(batchname==="0"|| marklist==="0"){
      errors.push({msg:'Please Select Required Fields'})
    }
    if(errors.length >0){
      res.render('dashboard',{schedule:schedule,user:req.user,batch:batch,error_msg:'Please select required feilds'});
    }else{
      const [trainee, metadata] = await db.sequelize.query(
        "SELECT * FROM TraineeTrainers where batch_id='"+batchname+"' and is_registered='Yes'"
      );
    
       
      const batchs = await  db.Batch.findOne({where:{batch_id:batchname}});
      const config= await  db.Config.findAll();
      const projectassess = await db.PracticalAssessmentTrainer.findOne({where:{technician_part:marklist}})
      if(projectassess){
        res.render('assossortotregisteredlist',{schedule:schedule,projectassess:projectassess.a_id,marklist:marklist,projectassess:projectassess,batchs:batchs,batch:batch,user:req.user,trainee:trainee,config:config});
      
      }else{
        if(marklist ==="Vehicle_Examination" || marklist === "Obstacle_Course_Preparation"){
          res.render('assossortotregisteredlist',{schedule:schedule,projectassess:'Obstacle_Course_Preparation',marklist:marklist,projectassess:projectassess,batchs:batchs,batch:batch,user:req.user,trainee:trainee,config:config});
      
        }else{
          res.render('dashboard',{schedule:schedule,user:req.user,batch:batch,error_msg:'Assessement Checklist Not Found'});
    
        }
        }
    }
 
  
   });
   router.post('/saveprojectaccessment',ensureAuthenticated,async function(req,res){
    var formData = req.body;
    console.log(formData);
     if(formData){
      const savedRow = {
    
        id:formData.traineeId,
        traineeId:formData.traineeId,
        message:'Successfully Saved'
        // Add other properties as needed
      };   

      db.TraineeTrainer.findOne({where:{id:formData.traineeId}}).then(tottrainee =>{
        if(tottrainee){
          const v1options = {
            node: [0x01, 0x23],
            clockseq: 0x1234,
            msecs: new Date('2011-11-01').getTime(),
            nsecs: 5678,
          };
          mid = uuidv4(v1options);
          var score;
          if(formData.asstype ==="Presentation"){
            score = formData.totalScore/3;
          }else{
            score =formData.totalScore
          }
          const asspracticaltot ={
            m_id:mid,
            trainee_id:tottrainee.uniqueid,
            assessment_part:formData.asstype,
            total_point: formData.asstotalpoint,
            score:  score,
        assessment_detail: formData.checklistData,
        assessment_id:formData.assid,
        assess_by:req.user.staffid,
        testcode:tottrainee.uniqueid,
        finish_time:0,
        attempt_no:0,
        education_id: tottrainee.licence_type
          }

          db.PracticalMarkTrainer.findOne({where:{trainee_id:tottrainee.uniqueid,assessment_id:formData.assid}}).then(totpm =>{
            if(totpm){
              db.PracticalMarkTrainer.update({
                assessment_detail:formData.checklistData,
                score: score},
                {where:{trainee_id:tottrainee.uniqueid,assessment_id:formData.assid}}).then(udtpmtot =>{
                  res.status(200).json({ savedRow});
                }).catch(err =>{
                  console.log(err)
                  res.status(500).json({ success: false, message: 'An unexpected error occurred', error: err.message });
    
                })
            }else{
              db.PracticalMarkTrainer.create(asspracticaltot).then(newpmdt =>{
                res.status(200).json({ savedRow});
              }).catch(err =>{
                console.log(err)
                res.status(500).json({ success: false, message: 'An unexpected error occurred', error: err.message });
    
              })
             
            }
          })

        }else{
          res.status(500).json({ success: false, message: 'An unexpected error occurred'});
    
        }
      }).catch(err =>{
        console.log(err)
        res.status(500).json({ success: false, message: 'Database error', error: err.message });

      })
     
     }else{
      res.status(400).json({ success: false, message: 'Validation error'});
 
     }
  
  
  
  
  })
   router.get('/assossornewtotselectedtrainees',ensureAuthenticated,async function(req,res){
    const [trainee, metadata] = await db.sequelize.query(
      "SELECT * FROM TraineeTrainers where is_selected='Yes'"
    );
    const config= await  db.Config.findAll();
    const batch = await  db.Batch.findAll({where:{is_current:'Yes'}});
    res.render('assossornewtotselectedtrainees',{batch:batch,user:req.user,trainee:trainee,config:config})
   })
  
   router.post('/exam', ensureAuthenticated, async function(req, res) {
     const {traineecode} =req.body;
     let errors  =[];
     const [schedule,metadata] = await db.sequelize.query("Select * from Schedules "+
     "where Schedules.staff_id = '"+req.user.staffid +"'")
     const config =await db.Config.findAll();
     const batch = await  db.Batch.findAll({where:{is_current:'Yes'}});
     if(!traineecode){
      errors.push({msg:'Please Enter Trainee Code First!'})

     }
     if(errors.length >0){
      res.render('dashboard',{schedule:schedule,user:req.user,errors,batch:batch});
     }else{
      var currentDate = new Date();
      db.TraineeTestCode.findOne({where:{createdAt:{
        [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
        [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
   
      },test_code:traineecode}}).then(traineecodes=>{
      
       if(traineecodes){
      
        var traineeid = traineecodes.trainee_id;
        console.log(traineeid)
        db.Trainee.findOne({where:{uniqueid:traineeid,attempt_count: {
          [Op.lt]: 4
        }}}).then(trainee =>{
         if(trainee){
          var isactive = trainee.is_active;
          var attempt = trainee.attempt_count;
          var reciptno = trainee.recept_no;
          var licesetype = trainee.licence_type;
          var currentDate = new Date();
          db.Schedule.findOne({where:{staff_id:req.user.staffid, 
        
            from_date:{
              [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
              [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
         
            },
            schedule_type:'Tehadso'
          }}).then(schedule =>{
            console.log(schedule)
           
          if(schedule){ 
            var practicaltest = schedule.technical_part;
           
            db.PracticalAssessment.findAll({where:{technician_part:practicaltest,
            education:licesetype
            }}).then(ptest =>{
              console.log(ptest)
              if(ptest){
                if(isactive =="Yes" && attempt < 4 && reciptno){
                  res.render('exam',{batch:batch,testcode:traineecode ,ptest:ptest,user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'Yes',schedule:schedule})
                }else{
                  res.render('exam',{batch:batch,testcode:traineecode ,ptest:ptest,user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'No',schedule:schedule})
                }
              }else{
                if(isactive =="Yes" && attempt < 4 && reciptno){
                  res.render('exam',{batch:batch,testcode:traineecode ,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'Yes',schedule:schedule})
                }else{
                  res.render('exam',{batch:batch,testcode:traineecode ,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'No',schedule:schedule})
                }
              }
            }).catch(err =>{
              console.log(err)
              if(isactive =="Yes" && attempt < 4 && reciptno){
                res.render('exam',{batch:batch,testcode:traineecode ,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'Yes',schedule:schedule})
              }else{
                res.render('exam',{batch:batch,testcode:traineecode ,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'No',schedule:schedule})
              }
            })
           
          }else{
            if(isactive =="Yes" && attempt < 4 && reciptno){
              res.render('exam',{batch:batch,testcode:traineecode,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,config:config,canassess:'No',cantake:'Yes',schedule:'ፈተናን ለመገምገም የጊዜ ሰሌዳ የለዎትም።'})
            }else{
              res.render('exam',{batch:batch,testcode:traineecode,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,config:config,canassess:'No',cantake:'No',schedule:'ፈተናን ለመገምገም የጊዜ ሰሌዳ የለዎትም።'})
            }
          }
          }).catch(err =>{
            console.log(err)
            if(isactive =="Yes" && attempt < 4 && reciptno){
              res.render('exam',{batch:batch,testcode:traineecode ,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,canassess:'No',config:config,cantake:'Yes',schedule:'ፈተናን ለመገምገም የጊዜ ሰሌዳ የለዎትም።'})
            }else{
              res.render('exam',{batch:batch,testcode:traineecode ,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,canassess:'No',config:config,cantake:'No',schedule:'ፈተናን ለመገምገም የጊዜ ሰሌዳ የለዎትም።'})
            }
          })
         }else{
          res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Cant Find Trainee Try Later Connection Error'});
  
         }

        }).catch(err =>{
          res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Cant Find Trainee Try Later Connection Error'});
  
        })
       
     
       }else{
        res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee With This Code Not Found'})
       }
      }).catch(err=>{
        console.log(err)
        res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Cant Find Trainee Try Later Connection Error'});
      })
    
     }
    
   });
   router.post('/takepracticalassessment',ensureAuthenticated,async function(req,res){
    const {testcode,output,topoint,finishtime,assessmentid,traineeid,traineeattempt,marks,assessmentpart,education} =req.body;
    const batch = await  db.Batch.findAll({where:{is_current:'Yes'}});
    const [schedule,metadata] = await db.sequelize.query("Select * from Schedules "+
    "where Schedules.staff_id = '"+req.user.staffid +"'")
    const v1options = {
      node: [0x01, 0x23],
      clockseq: 0x1234,
      msecs: new Date('2011-11-01').getTime(),
      nsecs: 5678,
    };
    mid = uuidv4(v1options);
    const pmarkData ={
      m_id:mid,
      trainee_id:traineeid,
      assessment_part:assessmentpart,
      total_point: topoint,
      score:  output,
  assessment_detail: JSON.parse(marks),
  assessment_id:assessmentid,
  assess_by:req.user.staffid,
  testcode:testcode,
  finish_time:finishtime,
  attempt_no:traineeattempt,
  education_id: education
    }

    db.PracticalMark.findOne({where:{ trainee_id:traineeid,testcode:testcode, assessment_part:assessmentpart, assessment_id:assessmentid,}}).then(mark =>{
      if(mark){
        res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Data Not Saved Try Again. Data Already With This Code Exist'});
    
      }else{
        db.PracticalMark.create(pmarkData).then(mark =>{
          if(mark){
            res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,success_msg:'Practical Assessment Saved Successfully'});
         
          
          }else{
            res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Data Not Saved Try Again. Connection Error'});
    
          }
         
        }).catch(err =>{
          res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Data Not Saved Try Again. Connection Error'});
    
        })
      }
    
    }).catch(err =>{
      res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Data Not Saved Try Again. Connection Error'});
  
    })
  
   });
   router.post('/practicalassessmenttottrainer', ensureAuthenticated, async function(req, res) {
    const {traineecode,exampart} =req.body;
    let errors  =[];
    const [schedule,metadata] = await db.sequelize.query("Select * from Schedules "+
    "where Schedules.staff_id = '"+req.user.staffid +"'")
    const config =await db.Config.findAll();
    const batch = await  db.Batch.findAll({where:{is_current:'Yes'}});
    if(!traineecode){
     errors.push({msg:'Please Enter Trainee Code First!'})

    }
    if(errors.length >0){
     res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,errors});
    }else{
     var currentDate = new Date();
     db.Appointment.findOne({where:{createdAt:{
       [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
       [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
  
     },trainee_id:traineecode}}).then(traineecodes=>{
     
      if(traineecodes){
     
       var traineeid = traineecodes.trainee_id;
       console.log(traineeid)
       db.TraineeTrainer.findOne({where:{trainee_code:traineeid}}).then(trainee =>{
        if(trainee){
         var isactive = trainee.is_active;
         var attempt = trainee.attempt_count;
         var reciptno = trainee.recept_no_training;
         var licesetype = trainee.licence_type;
         var currentDate = new Date();
         db.Schedule.findOne({where:{staff_id:req.user.staffid, 
       
           from_date:{
             [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
             [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
        
           },
          
         }}).then(schedule =>{
           console.log(schedule)
          
         if(schedule){ 
           var practicaltest = schedule.technical_part;
          
           db.PracticalAssessmentTrainer.findAll({where:{technician_part:practicaltest
        
           }}).then(ptest =>{
             console.log(ptest)
             if(ptest){
               if(isactive =="Yes" && attempt < 4 && reciptno){
                 res.render('examregistered',{batch:batch,testcode:traineecode ,ptest:ptest,user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'Yes',schedule:schedule})
               }else{
                 res.render('examregistered',{batch:batch,testcode:traineecode ,ptest:ptest,user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'No',schedule:schedule})
               }
             }else{
               if(isactive =="Yes" && attempt < 4 && reciptno){
                 res.render('examregistered',{batch:batch,testcode:traineecode ,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'Yes',schedule:schedule})
               }else{
                 res.render('examregistered',{batch:batch,testcode:traineecode ,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'No',schedule:schedule})
               }
             }
           }).catch(err =>{
             console.log(err)
             if(isactive =="Yes" && attempt < 4 && reciptno){
               res.render('examregistered',{batch:batch,testcode:traineecode ,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'Yes',schedule:schedule})
             }else{
               res.render('examregistered',{batch:batch,testcode:traineecode ,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'No',schedule:schedule})
             }
           })
          
         }else{
           if(isactive =="Yes" && attempt < 4 && reciptno){
             res.render('examregistered',{batch:batch,testcode:traineecode,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,config:config,canassess:'No',cantake:'Yes',schedule:'ፈተናን ለመገምገም የጊዜ ሰሌዳ የለዎትም።'})
           }else{
             res.render('examregistered',{batch:batch,testcode:traineecode,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,config:config,canassess:'No',cantake:'No',schedule:'ፈተናን ለመገምገም የጊዜ ሰሌዳ የለዎትም።'})
           }
         }
         }).catch(err =>{
           console.log(err)
           if(isactive =="Yes" && attempt < 4 && reciptno){
             res.render('examregistered',{batch:batch,testcode:traineecode ,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,canassess:'No',config:config,cantake:'Yes',schedule:'ፈተናን ለመገምገም የጊዜ ሰሌዳ የለዎትም።'})
           }else{
             res.render('examregistered',{batch:batch,testcode:traineecode ,ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',user:req.user,trainee:trainee,canassess:'No',config:config,cantake:'No',schedule:'ፈተናን ለመገምገም የጊዜ ሰሌዳ የለዎትም።'})
           }
         })
        }else{
         res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Cant Find Trainee Try Later Connection Error'});
 
        }

       }).catch(err =>{
         res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Cant Find Trainee Try Later Connection Error'});
 
       })
      
    
      }else{
       res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee With This Code Not Found'})
      }
     }).catch(err=>{
       console.log(err)
       res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Cant Find Trainee Try Later Connection Error'});
     })
   
    }
   
  });
   router.post('/takepracticalassessmenttrainerintrance',ensureAuthenticated,async function(req,res){
    const {output,topoint,finishtime,assessmentid,traineeid,traineeattempt,marks,assessmentpart,education} =req.body;
    const batch = await  db.Batch.findAll({where:{is_current:'Yes'}});
    const [schedule,metadata] = await db.sequelize.query("Select * from Schedules "+
    "where Schedules.staff_id = '"+req.user.staffid +"'")
    const v1options = {
      node: [0x01, 0x23],
      clockseq: 0x1234,
      msecs: new Date('2011-11-01').getTime(),
      nsecs: 5678,
    };
    mid = uuidv4(v1options);
    const pmarkData ={
      m_id:mid,
      trainee_id:traineeid,
      assessment_part:assessmentpart,
      total_point: topoint,
      score:  output,
  assessment_detail: JSON.parse(marks),
  assessment_id:assessmentid,
  assess_by:req.user.staffid,
  testcode:'0',
  finish_time:finishtime,
  attempt_no:traineeattempt,
  education_id: education
    }
    db.IntranceExamResult.findOne({where:{ trainee_id:traineeid}}).then(mark =>{
      if(mark){
        db.IntranceExamResult.update({practical_result:output,practical_count:parseInt(mark.practical_count)+1},{where:{trainee_id:traineeid}}).then(marks =>{
          if(marks){
            res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,success_msg:'Trainee Intrance Practical Result Saved Successfully'});
      
          
          }else{
            res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Data Not Saved Try Again. Data Already With This Code Exist'});
      
          }
         
        }).catch(err =>{
          console.log(err)
          res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Data Not Saved Try Again. Data Already With This Code Exist'});
      
        })
      }else{
        db.IntranceExamResult.create({trainee_id:traineeid,practical_result:output,practical_count:1}).then(marks =>{
          if(marks){
            res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,success_msg:'Practical Assessment Saved Successfully'});
         
          
          }else{
            res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Data Not Saved Try Again. Connection Error'});
    
          }
         
        }).catch(err =>{
          console.log(err)
          res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Data Not Saved Try Again. Connection Error'});
    
        })
      }
    
    }).catch(err =>{
      console.log(err)
      res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Data Not Saved Try Again. Connection Error'});
  
    })
  
   });
   router.post('/takepracticalassessmenttrainerregistered',ensureAuthenticated,async function(req,res){
    const {testcode,output,topoint,finishtime,assessmentid,traineeid,traineeattempt,marks,assessmentpart,education} =req.body;
    const batch = await  db.Batch.findAll({where:{is_current:'Yes'}});
    const [schedule,metadata] = await db.sequelize.query("Select * from Schedules "+
    "where Schedules.staff_id = '"+req.user.staffid +"'")
    const v1options = {
      node: [0x01, 0x23],
      clockseq: 0x1234,
      msecs: new Date('2011-11-01').getTime(),
      nsecs: 5678,
    };
    mid = uuidv4(v1options);
    const pmarkData ={
      m_id:mid,
      trainee_id:traineeid,
      assessment_part:assessmentpart,
      total_point: topoint,
      score:  output,
  assessment_detail: JSON.parse(marks),
  assessment_id:assessmentid,
  assess_by:req.user.staffid,
  testcode:testcode,
  finish_time:finishtime,
  attempt_no:traineeattempt,
  education_id: education
    }
console.log(assessmentid)
    db.PracticalMarkTrainer.findOne({where:{ trainee_id:traineeid, assessment_part:assessmentpart, assessment_id:assessmentid}}).then(mark =>{
      if(mark){
        res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Data Not Saved Try Again. Data Already With This Code Exist'});
    
      }else{
        db.PracticalMarkTrainer.create(pmarkData).then(mark =>{
          if(mark){
            res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,success_msg:'Practical Assessment Saved Successfully'});
         
          
          }else{
            res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Data Not Saved Try Again. Connection Error'});
    
          }
         
        }).catch(err =>{
          console.log(err);
          res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Data Not Saved Try Again. Connection Error'});
    
        })
      }
    
    }).catch(err =>{
      res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Data Not Saved Try Again. Connection Error'});
  
    })
  
   });
   router.post('/activatetraineeaccount',ensureAuthenticated,async function(req,res){
    const {receipt_no,traineeId} =req.body;
    const [trainee, metadata] = await db.sequelize.query(
      "SELECT * FROM Trainees"
    );
    let errors =[]
    const config= await  db.Config.findAll();
    const aLog ={
      trainee_id:traineeId,
      reciept_no: receipt_no,
      activate_by:req.user.staffid
    }
    if(!receipt_no || !trainee){
  errors.push({msg:'Please Enter Correct Reciept Number'});
    }
    if(errors.length>0){
      res.render('assossortraineelist',{errors,user:req.user,trainee:trainee,config:config});
       
    }else{
      db.Trainee.findOne({where:{uniqueid:traineeId,is_active:'No'}}).then(user =>{
        if(user){
          db.Trainee.update({is_active:'Yes',is_payed:'Yes',recept_no:receipt_no},{where:{uniqueid:traineeId}}).then(usr =>{
           db.ActivationLog.create(aLog).then(log =>{
            res.render('assossortraineelist',{user:req.user,success_msg:'Successfully Activate Trainee Account Code:'+user.trainee_code,user:req.user,trainee:trainee,config:config});
       
           }).catch(err =>{
            console.log(err)
            res.render('assossortraineelist',{user:req.user,error_msg:'Cant Activate Now Try Later!',user:req.user,trainee:trainee,config:config});
     
           })
            }).catch(err =>{
              console.log(err)
            res.render('assossortraineelist',{user:req.user,error_msg:'Cant Activate Now Try Later!!',user:req.user,trainee:trainee,config:config});
          })
        }
      }).catch(err =>{
        console.log(err)
        res.render('assossortraineelist',{user:req.user,error_msg:'Cant Activate Now Try Later!!!',user:req.user,trainee:trainee,config:config});
      })
    }
   

 })
 router.get('/download/:file(*)', function(req, res, next){
  const file = req.params.file;
  const filePath = path.join(__dirname,'../public/template/') + file;
  
  res.download(filePath, function(err){
    if (err) {
      console.log(err);
    } else {
      console.log('File downloaded successfully');
    }
  });
});
router.post('/practicalassessmenttottrainerintrance', ensureAuthenticated, async function(req, res) {
  const {traineecode} =req.body;
  let errors  =[];
  const [schedule,metadata] = await db.sequelize.query("Select * from Schedules "+
  "where Schedules.staff_id = '"+req.user.staffid +"' ")
  const config =await db.Config.findAll();
  const batch = await  db.Batch.findAll({where:{is_current:'Yes'}});
  if(!traineecode){
   errors.push({msg:'Please Enter Trainee Code First!'})

  }
  if(errors.length >0){
   res.render('dashboard',{schedule:schedule,user:req.user,errors});
  }else{
   var currentDate = new Date();
    db.TraineeTrainer.findOne({where:{trainee_code:traineecode}}).then(trainee =>{
      if(trainee)

      {
        
        db.Appointment.findOne({where:{appointment_date:{
          [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
          [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
     
        } }}).then(traineecode=>{
        
         if(traineecode){
        
          db.Schedule.findOne({where:{staff_id:req.user.staffid, 
          
            from_date:{
              [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
              [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
         
            },technical_part:'Intrance'
           
          }}).then(schedule =>{
            console.log(schedule)
           
          if(schedule){ 
            var practicaltest = schedule.technical_part;
           
            db.PracticalAssessmentTrainer.findAll({where:{technician_part:practicaltest,
         
            }}).then(ptest =>{
              console.log(ptest)
              if(ptest){
                res.render('examtrainer',{batch:batch,ptest:ptest,user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'Yes',schedule:schedule})
             
              }else{
                res.render('examtrainer',{ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',batch:batch,user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'Yes',schedule:schedule})
              
              }
            }).catch(err =>{
              console.log(err)
              res.render('examtrainer',{ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',batch:batch,user:req.user,trainee:trainee,config:config,canassess:'Yes',cantake:'Yes',schedule:schedule})
            
            })
           
          }else{
            res.render('examtrainer',{ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',batch:batch,user:req.user,trainee:trainee,config:config,canassess:'No',cantake:'Yes',schedule:'ፈተናን ለመገምገም የጊዜ ሰሌዳ የለዎትም።'})
          
          }
          }).catch(err =>{
            console.log(err)
            res.render('examtrainer',{ptest:'ተግባራዊ ፈተና ማግኘት አልተቻለም።',batch:batch, user:req.user,trainee:trainee,canassess:'No',config:config,cantake:'Yes',schedule:'ፈተናን ለመገምገም የጊዜ ሰሌዳ የለዎትም።'})
         
          })
         
       
         }else{
          res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Trainee Appointment Could Not Found'})
         }
        }).catch(err=>{
          console.log(err)
          res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Cant Find Trainee Try Later Connection Error'});
        })
      }
      else{
        res.render('dashboard',{batch:batch,schedule:schedule,user:req.user,error_msg:'Cant Find Trainee Try Later Connection Error'});
    
      }
    }).catch(err =>{
      res.render('dashboard',{schedule:schedule,user:req.user,error_msg:'Cant Find Trainee Try Later Connection Error'});
    
    })
 
 
  }
 
});
 router.get('/login', forwardAuthenticated, async (req, res) =>{
    res.render('login');
   });
  
  
// Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/login')

})

// Post Routers 
router.post('/login', (req, res, next) => {

    
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/login',
        failureFlash: true

    })(req, res, next);
});
module.exports = router;