const express = require('express');
const router = express.Router();

const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const passport = require('passport');
const db = require("../models")
const Op = db.Sequelize.Op;
const shortid = require('shortid');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
router.get('/addnewstaff', ensureAuthenticated, async function(req, res) {
  res.render('addstaff',{user:req.user});
 });

router.get('/allstafflist', ensureAuthenticated, async function(req, res) {
db.Staff.findAll().then(staff =>{
    res.render('allstafflist',{user:req.user,staff:staff});
}).catch(err =>{
    res.render('allstafflist',{user:req.user,staff:''});
})

});
router.get('/help',ensureAuthenticated,async function(req,res){
res.render('help',{user:req.user})
});
router.get('/configlist', ensureAuthenticated, async function(req, res) {

  db.Config.findAll({}).then(config =>{
     res.render('configlist',{config:config,user:req.user});
  }).catch(err =>{
     res.render('configlist',{config:'',user:req.user});
  })
 
 });
 router.post('/addconfig', ensureAuthenticated, async function(req, res) {

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
    const batch = await  db.Batch.findAll({});
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
  const {configval,configcat} =req.body;
  let errors =[];
  const v1options = {
     node: [0x01, 0x23],
     clockseq: 0x1234,
     msecs: new Date('2011-11-01').getTime(),
     nsecs: 5678,
   };
   configid = uuidv4(v1options);
  if(!configcat || !configval){
    errors.push({msg:'Please Enter Configuration Feild Value'})
  }
  if(errors.length>0){
     
     res.render('dashboardoffice',{errors,user:req.user});
  }else{
      const config ={
        config_id: configid,
        config_name: configval,
        config_type: configcat
      }
      db.Config.findOne({where:{config_name:configval}}).then(con=>{
        if(con){
           res.render('dashboardoffice',{regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,pass:pass,fail:fail, alltrainee:alltrainee,alltraineepayed:alltraineepayed,alltraineetakeexam:alltraineetakeexam,user:req.user,error_msg:'Configuration With Name Already Create Exists'});
        
        }else{
           db.Config.create(config).then(config =>{
              if(config){
                 res.render('dashboardoffice',{regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,pass:pass,fail:fail, alltrainee:alltrainee,alltraineepayed:alltraineepayed,alltraineetakeexam:alltraineetakeexam,user:req.user,success_msg:'Create System Configuration Successfully'});
              }else{
                 res.render('dashboardoffice',{regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,pass:pass,fail:fail, alltrainee:alltrainee,alltraineepayed:alltraineepayed,alltraineetakeexam:alltraineetakeexam,user:req.user,error_msg:'Cant Create Configuration'});
              }
            }).catch(err =>{
              res.render('dashboardoffice',{regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,pass:pass,fail:fail, alltrainee:alltrainee,alltraineepayed:alltraineepayed,alltraineetakeexam:alltraineetakeexam,user:req.user,error_msg:'Cant Create Configuration'});
            })
        }
      })
   
    
  }
 
 });
router.get('/createstaffcredential', ensureAuthenticated, async function(req, res) {
  
  db.Staff.findAll().then(staff =>{
    res.render('createstaffcredential',{user:req.user,staff:staff});
 }).catch(err =>{
    res.render('createstaffcredential',{user:req.user,staff:''});
 })
 });
 router.post('/addnewcredential', ensureAuthenticated, async function(req, res) {
  const {staffmemberid,username,password,userroll,repassword} =req.body;
  const v1options = {
     node: [0x01, 0x23],
     clockseq: 0x1234,
     msecs: new Date('2011-11-01').getTime(),
     nsecs: 5678,
   };
 const staff = await db.Staff.findAll({});
   aid = uuidv4(v1options);
   const userData = {
     staffid: staffmemberid,
  fullname: '',
  email:aid,
  photo: '',
  phone_number: '',
  username: username,
  password: password,
  user_roll: userroll,
  is_active: 'Yes'
   }
   let errors =[];
   if(!username || !staffmemberid ||!password || !userroll){
     errors.push({msg:'Please Enter All Required Fields'})
   }
   if( password != repassword){
     errors.push({msg:'Please Make Sure Password And ReType Password Are Same'})
   }
   if( staffmemberid =="0"){
     errors.push({msg:'Please Select Staff Member '})
   }
   if( userroll =="0"){
     errors.push({msg:'Please Select User Roll '})
   }
   if(errors.length >0){
     res.render('createstaffcredential',{user:req.user,errors});
   }else{

     db.User.findAll({
        where: {
          username: username,
          user_roll:userroll,
        
        }
    }).then(user => {
      //console.log(user);
      console.log(user);
            if (user.length ==0 ) {
                bcrypt.hash(password, 10, (err, hash) => {
                userData.password = hash;


                db.User.create(userData).then(usernew =>{
                 if(usernew){
                   res.render('createstaffcredential',{user:req.user,staff:staff,success_msg:'Create Assessor Credential Info Successfully'});
                 }else{
                   res.render('createstaffcredential',{user:req.user,staff:staff,error_msg:'Cant Create Assessor Credential Info Now Try Again'});
                 }
                   }).catch(err =>{
                    console.log(err)
                      res.render('createstaffcredential',{user:req.user,staff:staff,error_msg:'Cant Create Assessor Credential Info Now'});
                   })
                }); // 
            } else {
              res.render('createstaffcredential',{user:req.user,staff:staff,error_msg:'Registered User With This Credential Already Exist'})
            }
        }).catch(err => {
           console.log(err)
          res.render('createstaffcredential',{user:req.user,staff:staff,error_msg:'Error While Finding Credentials Created'})
        }); // end of then catch for findOne method 



     
   }

 });
router.get('/allcredentiallist', ensureAuthenticated, async function(req, res) {
const [credential, metadata] = await db.sequelize.query(
"SELECT * FROM Users JOIN Staffs ON Staffs.staff_id = Users.staffid"
);
res.render('allcredentiallist',{user:req.user,credential:credential});

});
router.get('/addnewappointment', ensureAuthenticated, async function(req, res) {
const config = await db.Config.findAll({})
db.Trainee.findAll({where:{
is_active:'Yes',
attempt_count: { [Op.lte]: 4},
pass_fail: {
  [Op.or]: [
    { [Op.ne]: 'PASS' },
    { [Op.is]: null }
  ]
}
}}).then(trainee =>{
  console.log("trainee");
console.log(trainee);
  res.render('addnewappointment',{user:req.user,trainee:trainee,config:config});
}).catch(err =>{ 
  console.log(err); 
  res.render('addnewappointment',{user:req.user,trainee:'',config:config});
})

});
router.get('/addnewappointmenttraineetrainerapplicant', ensureAuthenticated, async function(req, res) {
const config = await db.Config.findAll({})
const batch = await  db.Batch.findAll({});
db.TraineeTrainer.findAll({where:{
  is_selected:'Yes',
  is_active:'No'

}}).then(trainee =>{
    res.render('addnewappointmenttraineetrainerintrance',{batch:batch,user:req.user,trainee:trainee,config:config});
}).catch(err =>{
    res.render('addnewappointmenttraineetrainerintrance',{batch:batch,user:req.user,trainee:'',config:config});
})

});
router.get('/addnewappointmenttraineetrainerregistered', ensureAuthenticated, async function(req, res) {
  const config = await db.Config.findAll({})
  const batch = await  db.Batch.findAll({});
  db.TraineeTrainer.findAll({where:{
    is_selected:'Yes',
    is_active:'Yes',
    is_registered:'Yes',
  
  
  }}).then(trainee =>{
      res.render('addnewappointmenttraineetrainerregistered',{batch:batch,user:req.user,trainee:trainee,config:config});
  }).catch(err =>{
      res.render('addnewappointmenttraineetrainerregistered',{batch:batch,user:req.user,trainee:'',config:config});
  })
  
  });
router.get('/allappointmentlist', ensureAuthenticated, async function(req, res) {
  const config = await db.Config.findAll({})
  const [traineeapp,metadata] = await db.sequelize.query("select * from Appointments inner join "+
  "Trainees on Appointments.trainee_id =Trainees.uniqueid "
);
const [trainerapp,metadatat] = await db.sequelize.query("select * from Appointments inner join "+
" TraineeTrainers on Appointments.trainee_id =TraineeTrainers.trainee_code where  is_registered='Yes' and is_active='Yes'"
);
const [trainerapplicant,metadatatapp] = await db.sequelize.query("select * from Appointments inner join "+
" TraineeTrainers on Appointments.trainee_id =TraineeTrainers.trainee_code  where is_active='No' and is_registered='No'"
);
  console.log(traineeapp)
  res.render('allappointmentlist',{trainerapplicant:trainerapplicant,user:req.user,trainer:trainerapp,trainee:traineeapp,config:config});
 
});
router.post('/addnewappointment', ensureAuthenticated, async function(req, res) {

const {traineeid,apptag,appointmentdate,appointmentfor} =req.body;
var trainee ;
if(apptag ==="TraineeTrainer"){
  trainee  = await db.TraineeTrainer.findAll({where:{ recept_no_intrance:{ [Op.ne]:null}}
 })
}else{
  trainee  = await db.Trainee.findAll({where:{ is_active:'Yes', pass_fail: {
    [Op.or]: [
      { [Op.ne]: 'PASS' },
      { [Op.is]: null }
    ]
  },
  attempt_count: { [Op.lte]: 4},}})

}
const config = await db.Config.findAll();
let errors =[];
console.log(apptag)
console.log(traineeid)
console.log(appointmentdate)
if(!traineeid || !apptag || !appointmentdate || !appointmentfor){
  errors.push({msg:'Please Enter Required Feild Values'})
}
if(appointmentfor =="0"){
  errors.push({msg:'Please Select Appointment Purpose'})
}

if(errors.length>0){
  if(apptag ==="TraineeTrainer"){
    res.render('addnewappointmenttraineetrainer',{errors,trainee:trainee,config:config,user:req.user});
  
  }else{
    
    res.render('addnewappointment',{errors,trainee:trainee,config:config,user:req.user});

  }
    }else{
    const appointData ={
    
    trainee_id:traineeid,
    appointment_date:new Date(appointmentdate),
    appointment_for:appointmentfor,
    appointment_tag:apptag
    }
    db.Appointment.findOne({where:{trainee_id:traineeid,appointment_for:appointmentfor}}).then(appoint =>{
        if(appoint){
          db.Appointment.update({  appointment_date:new Date(appointmentdate)
          },{where:{trainee_id:traineeid}}).then(schedule =>{
            if(schedule){
              if(apptag ==="TraineeTrainer"){
                res.render('addnewappointmenttraineetrainer',{trainee:trainee,config:config,user:req.user,success_msg:'Appointment Updated Successfully'});
          
              }else{
                
                res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,success_msg:'Appointment Updated Successfully!!!'});
          
              }
              }else{
              if(apptag ==="TraineeTrainer"){
                
                res.render('addnewappointmenttraineetrainer',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Appointment '});
          
              }else{
                res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Appointment '});
          
              }
        }
          }).catch(err =>{
            if(apptag ==="TraineeTrainer"){
              
              res.render('addnewappointmenttraineetrainer',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Schedule'});
          
            }else{
              
              res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Schedule'});
            }
            })
        }else{
          db.Appointment.create(appointData).then(schedule =>{
            if(schedule){
              if(apptag ==="TraineeTrainer"){
                res.render('addnewappointmenttraineetrainer',{trainee:trainee,config:config,user:req.user,success_msg:'Appointment Created Successfully'});
          
              }else{
                
                res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,success_msg:'Appointment Created Successfully!!!'});
          
              }
              }else{
              if(apptag ==="TraineeTrainer"){
                
                res.render('addnewappointmenttraineetrainer',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Appointment '});
          
              }else{
                res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Appointment '});
          
              }
        }
          }).catch(err =>{
            if(apptag ==="TraineeTrainer"){
              
              res.render('addnewappointmenttraineetrainer',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Schedule'});
          
            }else{
              
              res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Schedule'});
            }
            })
        }
    }).catch(err =>{
      console.log(err)
    })
  
  
  
}

}); 
router.post('/addnewappointmenttraineetrainerintrance', ensureAuthenticated, async function(req, res) {

const {traineeid,apptag,appointmentdate,appointmentfor} =req.body;
var trainee ;
if(apptag ==="TraineeTrainer"){
  trainee  = await db.TraineeTrainer.findAll({where:{ recept_no_intrance:{ [Op.ne]:null}}
  })
}else{
  trainee  = await db.Trainee.findAll({where:{ is_active:'Yes', pass_fail: {
    [Op.or]: [
      { [Op.ne]: 'PASS' },
      { [Op.is]: null }
    ]
  },
  attempt_count: { [Op.lte]: 4},}})

}
const config = await db.Config.findAll();
const batch = await db.Batch.findAll();
let errors =[];
console.log(apptag)
console.log(traineeid) 
console.log(appointmentdate)
if(!traineeid || !apptag || !appointmentdate || !appointmentfor ){
  errors.push({msg:'Please Enter Required Feild Values'})
}
if(appointmentfor =="0"){
  errors.push({msg:'Please Select Appointment Purpose'})
}

if(errors.length>0){
  if(apptag ==="TraineeTrainer"){
    res.render('addnewappointmenttraineetrainerintrance',{batch:batch,errors,trainee:trainee,config:config,user:req.user});
  
  }else{
    
    res.render('addnewappointment',{errors,trainee:trainee,config:config,user:req.user});

  }
    }else{
    const appointData ={
    
    trainee_id:traineeid,
    appointment_date:new Date(appointmentdate),
    appointment_for:appointmentfor,
    appointment_tag:apptag,
   
    }
    db.Appointment.findOne({where:{trainee_id:traineeid,appointment_for:appointmentfor}}).then(appoint =>{
        if(appoint){
          db.Appointment.update({  appointment_date:new Date(appointmentdate)
          },{where:{trainee_id:traineeid}}).then(schedule =>{
            if(schedule){
              if(apptag ==="TraineeTrainer"){
                res.render('addnewappointmenttraineetrainerintrance',{batch:batch,trainee:trainee,config:config,user:req.user,success_msg:'Appointment Updated Successfully'});
          
              }else{
                
                res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,success_msg:'Appointment Updated Successfully!!!'});
          
              }
              }else{
              if(apptag ==="TraineeTrainer"){
                
                res.render('addnewappointmenttraineetrainerintrance',{batch:batch,trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Appointment '});
          
              }else{
                res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Appointment '});
          
              }
        }
          }).catch(err =>{
            if(apptag ==="TraineeTrainer"){
              
              res.render('addnewappointmenttraineetrainerintrance',{batch:batch,trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Schedule'});
          
            }else{
              
              res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Schedule'});
            }
            })
        }else{
          db.Appointment.create(appointData).then(schedule =>{
            if(schedule){
              if(apptag ==="TraineeTrainer"){
                res.render('addnewappointmenttraineetrainerintrance',{batch:batch,trainee:trainee,config:config,user:req.user,success_msg:'Appointment Created Successfully'});
          
              }else{
                
                res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,success_msg:'Appointment Created Successfully!!!'});
          
              }
              }else{
              if(apptag ==="TraineeTrainer"){
                
                res.render('addnewappointmenttraineetrainerintrance',{batch:batch,trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Appointment '});
          
              }else{
                res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Appointment '});
          
              }
        }
          }).catch(err =>{
            if(apptag ==="TraineeTrainer"){
              
              res.render('addnewappointmenttraineetrainerintrance',{batch:batch,trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Schedule'});
          
            }else{
              
              res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Schedule'});
            }
            })
        }
    }).catch(err =>{
      console.log(err)
    })
  
  
  
}

}); 
router.post('/addnewappointmenttraineetrainerregistered', ensureAuthenticated, async function(req, res) {

  const {traineeid,apptag,appointmentdate,appointmentfor,batchid} =req.body;
  var trainee ;
  if(apptag ==="TraineeTrainer"){
    trainee  = await db.TraineeTrainer.findAll({where:{ recept_no_intrance:{ [Op.ne]:null}}
    })
  }else{
    trainee  = await db.Trainee.findAll({where:{ is_active:'Yes', pass_fail: {
      [Op.or]: [
        { [Op.ne]: 'PASS' },
        { [Op.is]: null }
      ]
    },
    attempt_count: { [Op.lte]: 4},}})
  
  }
  const config = await db.Config.findAll();
  const batch = await db.Batch.findAll();
  let errors =[];
  console.log(apptag)
  console.log(traineeid) 
  console.log(appointmentdate)
  if(!traineeid || !apptag || !appointmentdate || !appointmentfor ||!batchid){
    errors.push({msg:'Please Enter Required Feild Values'})
  }
  if(appointmentfor =="0"){
    errors.push({msg:'Please Select Appointment Purpose'})
  }
  
  if(errors.length>0){
    if(apptag ==="TraineeTrainer"){
      res.render('addnewappointmenttraineetrainerregistered',{batch:batch,errors,trainee:trainee,config:config,user:req.user});
    
    }else{
      
      res.render('addnewappointment',{errors,trainee:trainee,config:config,user:req.user});
  
    }
      }else{
      const appointData ={
      
      trainee_id:traineeid,
      appointment_date:new Date(appointmentdate),
      appointment_for:appointmentfor,
      appointment_tag:apptag,
      batch_id:batchid
      }
      db.Appointment.findOne({where:{trainee_id:traineeid,appointment_for:appointmentfor}}).then(appoint =>{
          if(appoint){
            db.Appointment.update({  appointment_date:new Date(appointmentdate)
            },{where:{trainee_id:traineeid}}).then(schedule =>{
              if(schedule){
                if(apptag ==="TraineeTrainer"){
                  res.render('addnewappointmenttraineetrainerregistered',{batch:batch,trainee:trainee,config:config,user:req.user,success_msg:'Appointment Updated Successfully'});
            
                }else{
                  
                  res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,success_msg:'Appointment Updated Successfully!!!'});
            
                }
                }else{
                if(apptag ==="TraineeTrainer"){
                  
                  res.render('addnewappointmenttraineetrainerregistered',{batch:batch,trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Appointment '});
            
                }else{
                  res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Appointment '});
            
                }
          }
            }).catch(err =>{
              if(apptag ==="TraineeTrainer"){
                
                res.render('addnewappointmenttraineetrainerregistered',{batch:batch,trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Schedule'});
            
              }else{
                
                res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Schedule'});
              }
              })
          }else{
            db.Appointment.create(appointData).then(schedule =>{
              if(schedule){
                if(apptag ==="TraineeTrainer"){
                  res.render('addnewappointmenttraineetrainerregistered',{batch:batch,trainee:trainee,config:config,user:req.user,success_msg:'Appointment Created Successfully'});
            
                }else{
                  
                  res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,success_msg:'Appointment Created Successfully!!!'});
            
                }
                }else{
                if(apptag ==="TraineeTrainer"){
                  
                  res.render('addnewappointmenttraineetrainerregistered',{batch:batch,trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Appointment '});
            
                }else{
                  res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Appointment '});
            
                }
          }
            }).catch(err =>{
              if(apptag ==="TraineeTrainer"){
                
                res.render('addnewappointmenttraineetrainerregistered',{batch:batch,trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Schedule'});
            
              }else{
                
                res.render('addnewappointment',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Schedule'});
              }
              })
          }
      }).catch(err =>{
        console.log(err)
      })
    
    
    
  }
  
  }); 
router.post('/addappointmentfortotwithbatchregistered',ensureAuthenticated,async function(req,res){
  const {batchid,appointmentdate,appointmentfor} =req.body;
  const config = await db.Config.findAll();
  const trainee  = await db.TraineeTrainer.findAll({where:{   is_selected:'Yes',
  is_active:'Yes'}})

  let errors=[];
  const batch = await db.Batch.findAll();
  if(!appointmentdate || !appointmentfor || batchid ==="0"){
    errors.push({msg:'Please select all required fields'})
  }
  if(appointmentfor ==="0"){
    errors.push({msg:'Please select appointment for'})
  }

  if(errors.length>0){
    res.render('addnewappointmenttraineetrainerregistered',{batch:batch,errors,trainee:trainee,config:config,user:req.user});

  }
  else{
    db.Appointment.findOne({where:{batch_id:batchid,appointment_for:'All_Batch'}}).then(existapp =>{
    if(existapp){
      db.Appointment.update({appointment_date:appointmentdate},{where:{batch_id:batchid,appointment_for:appointmentfor}}).then(()=>{
        res.render('addnewappointmenttraineetrainerregistered',{success_msg:'Appointment Updated Successfully.', batch:batch,errors,trainee:trainee,config:config,user:req.user});
      
      })
    }else{
      db.Appointment.create({appointment_tag:'TraineeTrainer',appointment_date:new Date(appointmentdate),batch_id:batchid,appointment_for:appointmentfor}).then(appoint =>{
                if(appoint){
                  res.render('addnewappointmenttraineetrainerregistered',{success_msg:'Appointment Created Successfully.', batch:batch,errors,trainee:trainee,config:config,user:req.user});
              
                }else{
                  res.render('addnewappointmenttraineetrainerregistered',{batch:batch,errors,trainee:trainee,config:config,user:req.user,error_msg:'Cant Create Appointment Try Again.'});
              
                }
          }).catch(err =>{
            console.log(err);
            res.render('addnewappointmenttraineetrainerregistered',{error_msg:'Cant Create Appointment Try Again.',batch:batch,errors,trainee:trainee,config:config,user:req.user});
      
          })
    }
    }).catch(err =>{
console.log(err);
    })
    

  }
});
router.post('/addappointmentfortotwithbatchapplicant',ensureAuthenticated,async function(req,res){
  const {batchid,appointmentdate} =req.body;
  const config = await db.Config.findAll();
  const trainee  = await db.TraineeTrainer.findAll({where:{   is_selected:'Yes',
  is_active:'No'}})

  let errors=[];
  const batch = await db.Batch.findAll();
  if(!appointmentdate || batchid ==="0"){
   errors.push({msg:'Please select all required fields'})
  }

  if(errors.length>0){
    res.render('addnewappointmenttraineetrainerintrance',{batch:batch,errors,trainee:trainee,config:config,user:req.user});

  }
  else{
   db.Appointment.findOne({where:{batch_id:batchid,appointment_for:'All_Batch'}}).then(existapp =>{
    if(existapp){
      db.Appointment.update({appointment_date:appointmentdate},{where:{batch_id:batchid,appointment_for:'All_Batch'}}).then(()=>{
        res.render('addnewappointmenttraineetrainerintrance',{success_msg:'Appointment Updated Successfully.', batch:batch,errors,trainee:trainee,config:config,user:req.user});
      
      })
    }else{
      db.Appointment.create({appointment_tag:'TraineeTrainer',appointment_date:appointmentdate,batch_id:batchid,appointment_for:'All_Batch'}).then(appoint =>{
                if(appoint){
                  res.render('addnewappointmenttraineetrainerintrance',{success_msg:'Appointment Created Successfully.', batch:batch,errors,trainee:trainee,config:config,user:req.user});
              
                }else{
                  res.render('addnewappointmenttraineetrainerintrance',{batch:batch,errors,trainee:trainee,config:config,user:req.user,error_msg:'Cant Create AppointmentTry Now.'});
              
                }
          }).catch(err =>{
            console.log(err);
            res.render('addnewappointmenttraineetrainerintrance',{error_msg:'Cant Create AppointmentTry Now.',batch:batch,errors,trainee:trainee,config:config,user:req.user});
      
          })
    }
   }).catch(err =>{
console.log(err);
   })
   

  }
})
router.get('/addnewtraineetrainertrainee', ensureAuthenticated, async function(req, res) {
const batch = await db.Batch.findAll({})
db.Config.findAll().then(config =>{
    res.render('addnewtraineetrainertrainee',{batch:batch,user:req.user,config:config});
}).catch(err =>{
    res.render('addnewtraineetrainertrainee',{batch:batch,user:req.user,config:''});
})
});
router.get('/addnewtrainee', ensureAuthenticated, async function(req, res) {

db.Config.findAll().then(config =>{
    res.render('addnewtrainee',{user:req.user,config:config});
}).catch(err =>{
    res.render('addnewtrainee',{user:req.user,config:''});
})
});
router.get('/updatetraineeaccount', ensureAuthenticated, async function(req, res) {
const [trainee, metadata] = await db.sequelize.query(
    "SELECT * FROM Trainees where is_payed='No'"
  );
  const config= await  db.Config.findAll();
res.render('updatetraineeaccount',{user:req.user,trainee:trainee,config:config});
});
          router.get('/updatetrainetrainereaccount', ensureAuthenticated, async function(req, res) {
            const [trainee, metadata] = await db.sequelize.query(
              "SELECT * FROM TraineeTrainers where is_selected='Yes' and recept_no_intrance IS NULL order by updatedAt desc"
            );
            const config= await  db.Config.findAll();
            res.render('updatetrainetrainereaccount',{user:req.user,trainee:trainee,config:config});
          });
          router.get('/registertrainetrainereaccount', ensureAuthenticated, async function(req, res) {
            const [trainee, metadata] = await db.sequelize.query(
              " SELECT * FROM TraineeTrainers inner join "+
              " IntranceExamResults on trainee_id=uniqueid "+
              " where  is_selected='Yes' and tobe_registered='Yes' and is_registered='No' and recept_no_intrance IS NOT NULL "
              );
              const batch= await  db.Batch.findAll();
            const config= await  db.Config.findAll();
            res.render('registertrainetrainereaccount',{batch:batch,user:req.user,trainee:trainee,config:config});
          });
          router.post('/registertottrainee/(:traineeid)',ensureAuthenticated,async function(req,res) {
             const {recieptid,batchname} =req.body;
            const config= await  db.Config.findAll();
            const batch= await  db.Batch.findAll();
            const [trainee, metadata] = await db.sequelize.query(
               " SELECT * FROM TraineeTrainers inner join "+
               " IntranceExamResults on trainee_id=uniqueid inner join Batches on"+
               "  TraineeTrainers.batch_id= Batches.batch_id"+
               " where  is_selected='Yes'  and is_registered='No' and recept_no_intrance IS NOT NULL"
               );
            db.TraineeTrainer.findOne({where:{uniqueid:req.params.traineeid}}).then(tr =>{
             if(tr){
               db.TraineeTrainer.update({is_registered:'Yes',is_active:'Yes',recept_no_training:recieptid,batch_id:batchname},{where:{uniqueid:req.params.traineeid}}).then(udttr =>{
                  res.render('registertrainetrainereaccount',{batch:batch, user:req.user,trainee:trainee,config:config,success_msg:'Success! TOT Trainee Registered'});
            
               })
               .catch(err =>{
                  console.log(err);
                  res.render('registertrainetrainereaccount',{batch:batch,user:req.user,trainee:trainee,config:config,error_msg:'Error While Registering Try Later!'});
            
               })
             }else{
               res.render('registertrainetrainereaccount',{batch:batch,user:req.user,trainee:trainee,config:config,error_msg:'Error Cant Find Trainee'});
            
             }
            }).catch(err =>{
               res.render('registertrainetrainereaccount',{batch:batch,error_msg:'Network Error Try Again',user:req.user,trainee:trainee,config:config});
            
            })
         
         })
          router.get('/alltraineetrainerlistapplicant', ensureAuthenticated, async function(req, res) {
            const [trainee, metadata] = await db.sequelize.query(
              "SELECT * FROM TraineeTrainers where is_registered='No'"
            );
            const config= await  db.Config.findAll();
          res.render('alltraineetrainerlistapplicant',{user:req.user,trainee:trainee,config:config});
            
          }); 
          router.get('/alltraineetrainerlistregistered', ensureAuthenticated, async function(req, res) {
            const [trainee, metadata] = await db.sequelize.query(
              "SELECT * FROM TraineeTrainers where is_registered='Yes'"
            );
            const config= await  db.Config.findAll();
          res.render('alltraineetrainerlistregistered',{user:req.user,trainee:trainee,config:config});
            
          }); 
          router.get('/alltraineelist', ensureAuthenticated, async function(req, res) {
            const [trainee, metadata] = await db.sequelize.query(
              "SELECT * FROM Trainees"
            );
            const config= await  db.Config.findAll();
          res.render('alltraineelist',{user:req.user,trainee:trainee,config:config});
            
          });


     router.post('/addnewstaff', ensureAuthenticated, async function(req, res) {
      const {fullname,phone,address} =req.body;
      const v1options = {
         node: [0x01, 0x23],
         clockseq: 0x1234,
         msecs: new Date('2011-11-01').getTime(),
         nsecs: 5678,
       };
     
       sid = uuidv4(v1options);
       const staffData = {
         staff_id:sid,
          full_name: fullname,
          phone_no: phone,
          address: address,
          is_active: 'Yes'
       }
       let errors =[];
       if(!phone || !address ||!fullname){
         errors.push({msg:'Please Enter All Required Fields'})
       }
       if(errors.length >0){
         res.render('addstaff',{user:req.user,errors});
       }else{
         db.Staff.create(staffData).then(staff =>{
       if(staff){
         res.render('addstaff',{user:req.user,success_msg:'Create Staff Info Successfully'});
       }else{
         res.render('addstaff',{user:req.user,error_msg:'Cant Create Staff Info Now Try Again'});
       }
         }).catch(err =>{
            res.render('addstaff',{user:req.user,error_msg:'Cant Create Staff Info Now'});
         })
         
       }
  
     });
   
     router.post('/addnewtrainee', ensureAuthenticated, async function(req, res) {
      const {fullname,age,gender,educategory,school,refno} =req.body;
      const v1options = {
         node: [0x01, 0x23],
         clockseq: 0x1234,
         msecs: new Date('2011-11-01').getTime(),
         nsecs: 5678,
       };
     const config = await db.Config.findAll({});
    
       tid = uuidv4(v1options);
       const id = shortid.generate();
       const shortcode = id.replace(/[^a-zA-Z0-9]/g, '').substr(0, 5);
       const userData = {
         uniqueid: tid,
      fullname: fullname,
      phone_number:'',
      age:age,
      gender:gender,
      trainee_code: shortcode,
      password:'$2a$10$DjRhWPkdAy6Q8M1DXr3/SepmkYDvw9lTgYu9WTDLd4P.KAU/n58Xy',
      is_payed: 'No',
      school_from: school,
      licence_type:educategory,
      recept_no: '',
      attempt_count_prac:0,
      attempt_count: 0,
      is_active: 'No',
      ref_no: refno,
      pass_fail:'FAIL',
      is_sentto_ash:'No'
       }
       let errors =[];
       if(!age || !gender || !school || !refno ||!fullname || !educategory){
         errors.push({msg:'Please Enter All Required Fields'})
       }
      
       if( educategory =="0"){
         errors.push({msg:'Please Select Education Category'})
       }
       if( school =="0"){
         errors.push({msg:'Please Select School Name'})
       }
       if( gender =="0"){
         errors.push({msg:'Please Select Gender '})
       }
       if(errors.length >0){
         res.render('addnewtrainee',{user:req.user,errors,config:config});
       }else{

         db.Trainee.findAll({
            where: {
              trainee_code: shortcode,
            }
        }).then(user => {
          //console.log(user);
          console.log(user);
                if (user.length ==0 ) {
                  db.Trainee.create(userData).then(usernew =>{
                     if(usernew){
                       res.render('addnewtrainee',{user:req.user,config:config,success_msg:'Create Candidate(Tehadso) Info Successfully'});
                     }else{
                       res.render('addnewtrainee',{user:req.user,config:config,error_msg:'Cant Create Candidate(Tehadso) Info Now Try Again'});
                     }
                       }).catch(err =>{
                        console.log(err)
                          res.render('addnewtrainee',{user:req.user,config:config,error_msg:'Cant Create Candidate(Tehadso) Info Now'});
                       })
                } else {
                  res.render('addnewtrainee',{user:req.user,config:config,error_msg:'Registered Candidate(Tehadso)  Already Exist'})
                }
            }).catch(err => {
              console.log(err)
              res.render('addnewtrainee',{user:req.user,config:config,error_msg:'Error While Finding Candidate(Tehadso) Created'})
            }); // end of then catch for findOne method 
    
  
  
         
       }
  
     });

     router.post('/addnewtraineetrainertrainee', ensureAuthenticated, async function(req, res) {
      const {fullname,age,gender,educategory,phone} =req.body;
      const v1options = {
         node: [0x01, 0x23],
         clockseq: 0x1234,
         msecs: new Date('2011-11-01').getTime(),
         nsecs: 5678,
       };
     const config = await db.Config.findAll({});
     const batch = await db.Batch.findAll({});
   
     
       tid = uuidv4(v1options);
       const id = shortid.generate();
       const shortcode = id.replace(/[^a-zA-Z0-9]/g, '').substr(0, 5);
       const userData = {
         uniqueid: tid,
      fullname: fullname,
      phone_number:phone,
      age:age,
      gender:gender,
      trainee_code: shortcode,
      password:'$2a$10$DjRhWPkdAy6Q8M1DXr3/SepmkYDvw9lTgYu9WTDLd4P.KAU/n58Xy',
      is_payed: 'No',
      attempt_count_prac:0,
      licence_type:educategory,
      is_selected:'No',
      attempt_count: 0,
      attempt_count_prac:0,
      is_active: 'No',
      is_registered: 'No',
      batch_id:''
       }
       let errors =[];
       if(!age || !gender || !phone  ||!fullname || !educategory){
         errors.push({msg:'Please Enter All Required Fields'})
       }
      
       if( educategory =="0"){
         errors.push({msg:'Please Select Education Category'})
       }
      
       if( gender =="0"){
         errors.push({msg:'Please Select Gender '})
       }
       if(errors.length >0){
         res.render('addnewtraineetrainertrainee',{batch:batch, user:req.user,errors,config:config});
       }else{

         db.TraineeTrainer.findAll({
            where: {
              trainee_code: shortcode,
            
            }
        }).then(user => {
          //console.log(user);
          console.log(user);
                if (user.length ==0 ) {
                  db.TraineeTrainer.create(userData).then(usernew =>{
                     if(usernew){
                      res.render('studentid', {
                        name: req.body.fullname,
                        phone: req.body.phone,
                        code:shortcode,
                        license:req.body.educategory
                      });
                      //  res.render('addnewtraineetrainertrainee',{batch:batch,user:req.user,config:config,success_msg:'Create TOT(Trainee) Info Successfully'});
                     }else{
                       res.render('addnewtraineetrainertrainee',{batch:batch,user:req.user,config:config,error_msg:'Cant Create Trainee Info Now Try Again'});
                     }
                       }).catch(err =>{
                        console.log(err)
                          res.render('addnewtraineetrainertrainee',{batch:batch,user:req.user,config:config,error_msg:'Cant Create Trainee Info Now'});
                       })
                } else {
                  res.render('addnewtraineetrainertrainee',{user:req.user,config:config,error_msg:'Registered TOT(Trainee) With This Name Already Exist'})
                }
            }).catch(err => {
              res.render('addnewtraineetrainertrainee',{batch:batch,user:req.user,config:config,error_msg:'Error While Registering TOT(Trainee) Try Again'})
            }); // end of then catch for findOne method 
    
  
  
         
       }
  
     });
     router.post('/activatetraineeaccount',ensureAuthenticated,async function(req,res){
        const {receipt_no,traineeId} =req.body;
        const [trainee, metadata] = await db.sequelize.query(
          "SELECT * FROM Trainees where is_active='No'"
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
          res.render('updatetraineeaccount',{errors,user:req.user,trainee:trainee,config:config});
           
        }else{
          db.Trainee.findOne({where:{uniqueid:traineeId,is_active:'No'}}).then(user =>{
            if(user){
              db.Trainee.findOne({where:{recept_no:receipt_no}}).then(recipt =>{
                if(recipt){
                  res.render('updatetraineeaccount',{user:req.user,error_msg:'Cant Activate Reciept No Already Exist!!!',user:req.user,trainee:trainee,config:config});
     
                }else{
                  db.Trainee.update({is_active:'Yes',is_payed:'Yes',recept_no:receipt_no},{where:{uniqueid:traineeId}}).then(usr =>{
                    db.ActivationLog.create(aLog).then(log =>{
                     db.Trainee.findAll({where:{is_active:'No'}}).then(trainees =>{
                       res.render('updatetraineeaccount',{user:req.user,success_msg:'Successfully Activate Trainee Account Code:'+user.trainee_code,user:req.user,trainee:trainees,config:config});
                
                     }).catch(err =>{
                       res.render('updatetraineeaccount',{user:req.user,success_msg:'Successfully Activate Trainee Account Code:'+user.trainee_code,user:req.user,trainee:trainee,config:config});
                
                     })
                   
                    }).catch(err =>{
                     console.log(err)
                     res.render('updatetraineeaccount',{user:req.user,error_msg:'Cant Activate Now Try Later!',user:req.user,trainee:trainee,config:config});
              
                    })
                     }).catch(err =>{
                       console.log(err)
                     res.render('updatetraineeaccount',{user:req.user,error_msg:'Cant Activate Now Try Later!!',user:req.user,trainee:trainee,config:config});
                   })
                }
              }).catch(err =>{
                res.render('updatetraineeaccount',{user:req.user,error_msg:'Cant Activate Error Finding Reciept No!!',user:req.user,trainee:trainee,config:config});
             
              })
            
            }
          }).catch(err =>{
            console.log(err)
            res.render('updatetraineeaccount',{user:req.user,error_msg:'Cant Activate Now Try Later!!!',user:req.user,trainee:trainee,config:config});
          })
        }
       

     })
     router.post('/confirmselectedtotintrancepayment',ensureAuthenticated,async function(req,res){
      const {receipt_no,traineeId,paymenttype} =req.body;
      const [trainee, metadata] = await db.sequelize.query(
        "SELECT * FROM TraineeTrainers where is_selected='Yes' and recept_no_intrance IS  NULL order by updatedAt desc"
      );
      let errors =[]
      const config= await  db.Config.findAll();
      const aLog ={
        trainee_id:traineeId,
        reciept_no: receipt_no,
        activate_by:req.user.staffid
      }
      if(!receipt_no || !trainee || !paymenttype){
    errors.push({msg:'Please Enter Correct Reciept Number'});
      }
      if(paymenttype =="0"){
        errors.push({msg:'Please Payment Type'});
          }
      if(errors.length>0){
        res.render('updatetrainetrainereaccount',{errors,user:req.user,trainee:trainee,config:config});
         
      }else{
        db.TraineeTrainer.findOne({where:{recept_no_intrance:receipt_no}}).then(user =>{
          if(!user){
            var udtqry 
            if(paymenttype ==="Intrance") {
              udtqry ={ recept_no_intrance:receipt_no,
            
               }
             }
            else if(paymenttype ==="Training") {
             udtqry ={ recept_no_training:receipt_no,
              is_active: 'Yes'
              }
            }else{
              udtqry ={
                recept_no_certificate: receipt_no}
            }
            
            db.TraineeTrainer.update(udtqry,{where:{uniqueid:traineeId}}).then(usr =>{
             db.ActivationLog.create(aLog).then(log =>{
              res.render('updatetrainetrainereaccount',{user:req.user,success_msg:'Successfully Add Payment TOT(Trainee)',user:req.user,trainee:trainee,config:config});
         
             }).catch(err =>{
              console.log(err)
              res.render('updatetrainetrainereaccount',{user:req.user,error_msg:'Cant Add Payment Now Try Later!',user:req.user,trainee:trainee,config:config});
       
             })
              }).catch(err =>{
                console.log(err)
              res.render('updatetrainetrainereaccount',{user:req.user,error_msg:'Cant Add Payment Now Try Later!!',user:req.user,trainee:trainee,config:config});
            })
          }else{
            console.log(user)
          }
        }).catch(err =>{
          console.log(err)
          res.render('updatetrainetrainereaccount',{user:req.user,error_msg:'Cant Add Payment Now Try Later!!!',user:req.user,trainee:trainee,config:config});
        })
      }
     

   })
   router.post('/activatetottraineeaccount',ensureAuthenticated,async function(req,res){
    const {receipt_no,traineeId,paymenttype} =req.body;
    const [trainee, metadata] = await db.sequelize.query(
      "SELECT * FROM TraineeTrainers where is_selected='Yes' order by updatedAt desc"
    );
    let errors =[]
    const config= await  db.Config.findAll();
    const aLog ={
      trainee_id:traineeId,
      reciept_no: receipt_no,
      activate_by:req.user.staffid
    }
    if(!receipt_no || !trainee || !paymenttype){
  errors.push({msg:'Please Enter Correct Reciept Number'});
    }
    if(paymenttype =="0"){
      errors.push({msg:'Please Payment Type'});
        }
    if(errors.length>0){
      res.render('updatetrainetrainereaccount',{errors,user:req.user,trainee:trainee,config:config});
       
    }else{
      db.TraineeTrainer.findOne({where:{uniqueid:traineeId}}).then(user =>{
        if(user){
          var udtqry 
          if(paymenttype ==="Intrance") {
            udtqry ={ recept_no_intrance:receipt_no,
             is_active: 'Yes'
             }
           }
          else if(paymenttype ==="Training") {
           udtqry ={ recept_no_training:receipt_no,
            is_active: 'Yes'
            }
          }else{
            udtqry ={
              recept_no_certificate: receipt_no}
          }
          db.TraineeTrainer.update(udtqry,{where:{uniqueid:traineeId}}).then(usr =>{
           db.ActivationLog.create(aLog).then(log =>{
            res.render('updatetrainetrainereaccount',{user:req.user,success_msg:'Successfully Add Payment TOT(Trainee) Account Code:'+user.trainee_code,user:req.user,trainee:trainee,config:config});
       
           }).catch(err =>{
            console.log(err)
            res.render('updatetrainetrainereaccount',{user:req.user,error_msg:'Cant Add Payment Now Try Later!',user:req.user,trainee:trainee,config:config});
     
           })
            }).catch(err =>{
              console.log(err)
            res.render('updatetrainetrainereaccount',{user:req.user,error_msg:'Cant Add Payment Now Try Later!!',user:req.user,trainee:trainee,config:config});
          })
        }
      }).catch(err =>{
        console.log(err)
        res.render('updatetrainetrainereaccount',{user:req.user,error_msg:'Cant Add Payment Now Try Later!!!',user:req.user,trainee:trainee,config:config});
      })
    }
   

 })
module.exports = router;