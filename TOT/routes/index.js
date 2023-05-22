const express = require('express');
const router = express.Router();

const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const passport = require('passport');
const db = require("../models")
const Op = db.Sequelize.Op;
const { v4: uuidv4 } = require('uuid');


router.get('/', forwardAuthenticated, async (req, res) =>{
   
  res.render('index',{});
 });

 router.get('/dashboard', ensureAuthenticated, async (req, res) =>{
    const config = await db.Config.findAll({});
    const language = req.session.language;
   
    const [pm,pmmeta] =await db.sequelize.query(`select trainee_id,practical_count ,sum(practical_result) as pscore from IntranceExamResults  where trainee_id ='${req.user.uniqueid}'
    group by trainee_id,practical_count`);
    const [tm,tmmeta] = await db.sequelize.query(`select trainee_id,theory_count ,sum(theory_result) as tscore from IntranceExamResults  where trainee_id ='${req.user.uniqueid}'
    group by trainee_id, theory_count`)
    res.render('dashboard',{language,pm:pm,tm:tm,successmsg:'',user:req.user,config:config,licence_type:req.user.licence_type});
   });


router.get('/examintrance/(:language)', ensureAuthenticated, async function(req, res) {
console.log(req.user.licence_type)
  const [idArrayString,meta1] = await db.sequelize.query("SELECT GROUP_CONCAT(id SEPARATOR ',') "+
  "as id_array FROM TrainerQuestionBanks WHERE assessment_type = 'Intrance' and language ='"+req.params.language+"'");
  // Assuming the id_array string is stored in a variable called idArrayString
  const idArrayStrings = meta1[0].id_array;
  var idArray1;
  if(idArrayStrings !=null){
    idArray1  = idArrayStrings.split(',').map(id => parseInt(id));
    const arr1 =idArray1;


    function generateArray() {
     
       
        const result = [...arr1];
    
        const uniqueArray = [...new Set(result)];
        console.log(result);
    
        const shuffledArray = shuffleArray(uniqueArray);
     //   console.log(`Number of Array shuffledArray: ${shuffledArray}`);
        const numItemsPerArray = Math.floor(50 / 1);
    
        const resultArray = [
          ...shuffledArray.slice(0, numItemsPerArray),
        ];
        
       
          const randomSample = resultArray.slice(0, 50);
          console.log(`Number of Array randomSample: ${resultArray}`);
          console.log(`Number of Array randomSample: ${resultArray.length}`);
        return randomSample;    
      }
      function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
      }
      
    
      function getRemainingArray(arr1, resultArray) {
        let remainingArray = arr1.concat(resultArray);
        resultArray.forEach(value => {
          const index = remainingArray.indexOf(value);
          if (index !== -1) {
            remainingArray.splice(index, 1);
          }
        });
        const n = 50 - resultArray.length;
        const randomValues = [];
        while (randomValues.length < n && remainingArray.length > 0) {
          const index = Math.floor(Math.random() * remainingArray.length);
          const value = remainingArray.splice(index, 1)[0];
          randomValues.push(value);
        }
        return randomValues;
       
      }
    
    
      const generatedArray = generateArray();
    
      
      
      
  db.Appointment.findAll({where:{trainee_id:req.user.trainee_code,appointment_for:'ITheoretical'}}).then(trainee =>{
  if(trainee){
    db.TrainerQuestionBank.findAll({where:{id: {
      [Op.in]: generatedArray
    }}}).then(question =>{
      res.render('examintrance',{successmsg:'',user:req.user,question:question});
  }).catch(err => {
      res.render('examintrance',{successmsg:'',user:req.user,question:''});
  })
  }else{
    
  }
  }).catch(err =>{

  })
   
  }else{
    res.render('examintrance',{user:req.user,question:'',successmsg:'No Question Found Contact Adminstrator'});
  }

});

router.get('/exam/(:language)', ensureAuthenticated, async function (req, res) {
  console.log(req.user.batch_id)
  var currentDate = new Date();
   const asstype = await  db.Appointment.findOne({where:{batch_id:req.user.batch_id,
    appointment_date:{
      [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
      [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
  
    }
  }});
      
  if(!asstype){
    res.render('exam',{asstype:'',user:req.user,question:'',successmsg:'No Appointment Found Contact Adminstrator'});
  
     
  } else {
      const [idArrayString,meta1] = await db.sequelize.query("SELECT GROUP_CONCAT(id SEPARATOR ',') "+
      "as id_array FROM TrainerQuestionBanks WHERE assessment_type = '"+asstype.appointment_for +"' and language ='"+req.params.language+"' and education='"+req.user.licence_type +"'");
      console.log(idArrayString)
      console.log(asstype)
      // Assuming the id_array string is stored in a variable called idArrayString
      const idArrayStrings = meta1[0].id_array;
      var idArray1;
      if(idArrayStrings !=null){
        idArray1  = idArrayStrings.split(',').map(id => parseInt(id));
        const arr1 =idArray1;
    
    
        function generateArray() {
         
           
            const result = [...arr1];
        
            const uniqueArray = [...new Set(result)];
            console.log(result);
        
            const shuffledArray = shuffleArray(uniqueArray);
         //   console.log(`Number of Array shuffledArray: ${shuffledArray}`);
            const numItemsPerArray = Math.floor(50 /1 );
        
            const resultArray = [
              ...shuffledArray.slice(0, numItemsPerArray),
            ];
            
           
              const randomSample = resultArray.slice(0, 50);
              console.log(`Number of Array randomSample: ${resultArray}`);
              console.log(`Number of Array randomSample: ${resultArray.length}`);
            return randomSample;    
          }
          function shuffleArray(array) {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
          }
          
        
          function getRemainingArray(arr1, resultArray) {
            let remainingArray = arr1.concat(resultArray);
            resultArray.forEach(value => {
              const index = remainingArray.indexOf(value);
              if (index !== -1) {
                remainingArray.splice(index, 1);
              }
            });
            const n = 50 - resultArray.length;
            const randomValues = [];
            while (randomValues.length < n && remainingArray.length > 0) {
              const index = Math.floor(Math.random() * remainingArray.length);
              const value = remainingArray.splice(index, 1)[0];
              randomValues.push(value);
            }
            return randomValues;
           
          }
        
        
          const generatedArray = generateArray();
        
          db.TrainerQuestionBank.findAll({where:{id: {
            [Op.in]: generatedArray
          }}}).then(question =>{
            res.render('exam',{asstype:asstype.appointment_for ,successmsg:'',user:req.user,question:question});
        }).catch(err => {
            res.render('exam',{asstype:asstype.appointment_for,successmsg:'',user:req.user,question:''});
        })
          
    
       
      }else{
        res.render('exam',{asstype:asstype.appointment_for,user:req.user,question:'',successmsg:'No Question Found Contact Adminstrator'});
      }}
  });
router.post('/submitintranceexam',ensureAuthenticated,async function(req,res){
  const{answer} = req.body;
 
 
  //console.log(answer);
  const config =await db.Config.findAll({});
  const [pm,pmmeta] =await db.sequelize.query(`select trainee_id,practical_count ,sum(practical_result) as pscore from IntranceExamResults  where trainee_id ='${req.user.uniqueid}'
  group by trainee_id,practical_count`);
  const [tm,tmmeta] = await db.sequelize.query(`select trainee_id,theory_count ,sum(theory_result) as tscore from IntranceExamResults  where trainee_id ='${req.user.uniqueid}'
  group by trainee_id, theory_count`)
  const answers = JSON.parse(answer);
  let score = 0;
  const promises = answers.map(answer => {
   const questionId = Object.keys(answer)[0];
   const answerValue = answer[questionId];
 
   // Query the database for the correct answer for this question
   return db.TrainerQuestionBank.findOne({
     where: { q_id: questionId }
   })
   .then((question) => {
     if (question && question.answer === answerValue) {
       // If the answer is correct, increment the score
       score++;
     }
   })
   .catch((err) => {
     console.error('Error querying database:', err);
   });
 })
 const language = req.session.language;
 const sql = "SELECT last_exam_post_date FROM TraineeTrainers WHERE uniqueid ='"+req.user.uniqueid+"'";
 const[result,resultmeta] =await db.sequelize.query(sql);
 // Wait for all queries to complete before outputting the score
 Promise.all(promises).then(() => {
   console.log('Your score is: ' + score);
   const v1options = {
     node: [0x01, 0x23],
     clockseq: 0x1234,
     msecs: new Date('2011-11-01').getTime(),
     nsecs: 5678,
   };
 
   tm_id = uuidv4(v1options);
   const theorymark = {
    
     trainee_id: req.user.uniqueid,
     theory_result: parseInt(score)*2 ,
     theory_count:1,
     practical_count:0,
     
   }
 
    const lastExamPostDate = result[0].last_exam_post_date;
    const today = new Date();
    const lastExamPostDatePlusOneDay = new Date(lastExamPostDate);
    lastExamPostDatePlusOneDay.setDate(lastExamPostDatePlusOneDay.getDate() + 1);
 
    if (today >= lastExamPostDatePlusOneDay) {
      db.IntranceExamResult.findOne({ where: {trainee_id: req.user.uniqueid,}
    
      }).then((theoretical_mark) => {
         if(theoretical_mark ){
         var theorymarkcount = parseInt(theoretical_mark.theory_count) +1;
          db.IntranceExamResult.update({theory_result: parseInt(score)*2 ,theory_count:theorymarkcount},{where:{ trainee_id: req.user.uniqueid}}).then(thmarkudt=>{
            if(thmarkudt){
              db.TraineeTrainer.update({last_exam_post_date:new Date()},{where:{uniqueid:req.user.uniqueid}}).then(()=>{
                res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'You Are Successfully Update Intrance Examination. Your Score Is' +parseInt(score)*2})
            
              }).catch(err =>{
                console.log(err);
               
              })
          
           }else{
              res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Error While Saving Your Score. Network Error Please Take Exam Again.'})
            
            }
          }).catch(err =>{
            console.log(err);
            
            res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Error While Saving Your Score. Network Error Please Take Exam Again.'})
           
          })
         }else{
          
          db.IntranceExamResult.create(theorymark).then(thmark =>{
            if(thmark){
              db.TraineeTrainer.update({last_exam_post_date:new Date()},{where:{uniqueid:req.user.uniqueid}}).then(()=>{
                res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'You Are Successfully Finish Intrance Examination. Your Score Is' +score*2})
           
              }).catch(err =>{
                console.log(err);
                
                
              })
          
             }else{
              res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Error While Saving Your Score. Network Error Please Take Exam Again.'})
            
            }
          }).catch(err =>{
            console.log(err);
            
            res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Error While Saving Your Score. Network Error Please Take Exam Again.'})
           
          })
         }
       });
    } else {
      
      res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'You Have Already Posted An Exam Result Today'})
           
    }
  
 
 });
 
 
 });
router.post('/submittottheoreticalassessment',ensureAuthenticated,async function(req,res){
const{answer,asstype} = req.body;


//console.log(answer);
const config =await db.Config.findAll({});
const [pm,pmmeta] =await db.sequelize.query(`select trainee_id,practical_count ,sum(practical_result) as pscore from IntranceExamResults  where trainee_id ='${req.user.uniqueid}'
group by trainee_id,practical_count`);
const [tm,tmmeta] = await db.sequelize.query(`select trainee_id,theory_count ,sum(theory_result) as tscore from IntranceExamResults  where trainee_id ='${req.user.uniqueid}'
group by trainee_id, theory_count`)
const answers = JSON.parse(answer);
let score = 0;
const promises = answers.map(answer => {
const questionId = Object.keys(answer)[0];
const answerValue = answer[questionId];

// Query the database for the correct answer for this question
return db.TrainerQuestionBank.findOne({
  where: { q_id: questionId }
})
.then((question) => {
  if (question && question.answer === answerValue) {
    // If the answer is correct, increment the score
    score++;
  }
})
.catch((err) => {
  console.error('Error querying database:', err);
});
})
const language = req.session.language;
const sql = "SELECT last_exam_post_date FROM TraineeTrainers WHERE uniqueid ='"+req.user.uniqueid+"'";
const[result,resultmeta] =await db.sequelize.query(sql);
// Wait for all queries to complete before outputting the score
Promise.all(promises).then(() => {
console.log('Your score is: ' + score);
const v1options = {
  node: [0x01, 0x23],
  clockseq: 0x1234,
  msecs: new Date('2011-11-01').getTime(),
  nsecs: 5678,
};

tm_id = uuidv4(v1options);
const theorymark = {
  m_id:tm_id,
  batch_id:req.user.batch_id,
  trainee_id: req.user.uniqueid,
  licence_type: req.user.licence_type,
  
  
}
let fieldToUpdate = '';
  switch (asstype) {
    case 'Continuous_1':
      fieldToUpdate = 'continues_one';
      break;
    case 'Continuous_2':
      fieldToUpdate = 'continues_two';
      break;
      case 'Continuous_3':
        fieldToUpdate = 'continues_three';
        break;
        case 'Continuous_4':
          fieldToUpdate = 'continues_four';
          break;
          case 'Final_1':
            fieldToUpdate = 'final_one';
            break;
            case 'Final_2':
              fieldToUpdate = 'final_two';
              break;
              case 'Final_3':
                fieldToUpdate = 'final_three';
                break;
                case 'Final_4':
                  fieldToUpdate = 'final_four';
                  break;
    // Add more cases for other assessment types as needed
    default:
      res.status(400).send('Invalid assessment type');
      return;
  }
  const query = `UPDATE TOTTraineeMarks SET ${fieldToUpdate} = ${score} WHERE  batch_id = '${req.user.batch_id}' AND trainee_id = '${req.user.uniqueid}' AND licence_type = '${req.user.licence_type}'`;

const lastExamPostDate = result[0].last_exam_post_date;
const today = new Date();
const lastExamPostDatePlusOneDay = new Date(lastExamPostDate);
lastExamPostDatePlusOneDay.setDate(lastExamPostDatePlusOneDay.getDate() + 1);

if (today >= lastExamPostDatePlusOneDay) {
  db.TOTTraineeMark.findOne({ where: {trainee_id: req.user.uniqueid,}

  }).then((totmark) => {
      if(totmark ){
     
      db.sequelize.query(query).then(thmarkudt=>{
        if(thmarkudt){
          db.TraineeTrainer.update({last_exam_post_date:new Date()},{where:{uniqueid:req.user.uniqueid}}).then(()=>{
            res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'You Are Successfully Finish Examination. Your Score Is' +parseInt(score)*2})
       
          }).catch(err =>{
            console.log(err);
            
            
          })
      
        }else{
          res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Error While Saving Your Score. Network Error Please Take Exam Again.'})
        
        }
      }).catch(err =>{
        console.log(err);
        
        res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Error While Saving Your Score. Network Error Please Take Exam Again.'})
        
      });
      }else{
      
      db.TOTTraineeMark.create(theorymark).then(thmark =>{
        if(thmark){
          db.sequelize.query(query).then(uped =>{
            db.TraineeTrainer.update({last_exam_post_date:new Date()},{where:{uniqueid:req.user.uniqueid}}).then(()=>{
              res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'You Are Successfully Finish Intrance Examination. Your Score Is' +score*2})
          
            }).catch(err =>{
              console.log(err);
              
              
            })
        
          }).catch(err =>{
            console.log(err);
          })
       
          }else{
          res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Error While Saving Your Score. Network Error Please Take Exam Again.'})
        
        }
      }).catch(err =>{
        console.log(err);
        
        res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Error While Saving Your Score. Network Error Please Take Exam Again.'})
        
      })
      }
    });
} else {
  
  res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'You Have Already Posted An Exam Result Today'})
        
}


});


});
router.get('/login', forwardAuthenticated, async (req, res) =>{
  res.render('login');
});


// Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/misaleacadamyapproval/login')

})

// Post Routers 

router.post('/login', (req, res, next) => {

  req.session.language = req.body.language;
  console.log( req.body.language)
  passport.authenticate('local', {
      successRedirect: '/misaleacadamyapproval/dashboard',
      failureRedirect: '/misaleacadamyapproval/login',
      failureFlash: true

  })(req, res, next);
});




// Example usage

module.exports = router;