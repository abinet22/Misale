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
   
    const [pm,pmmeta] =await db.sequelize.query(`select trainee_id,attempt_no ,sum(score) as pscore from PracticalMarks  where trainee_id ='${req.user.uniqueid}'
    group by testcode,trainee_id,attempt_no`);
    const [tm,tmmeta] = await db.sequelize.query(`select trainee_id,attempt_no_theory ,sum(theoretical_score) as tscore from TheoreticalMarks  where trainee_id ='${req.user.uniqueid}'
    group by trainee_id,attempt_no_theory`)
    res.render('dashboard',{language,pm:pm,tm:tm,successmsg:'',user:req.user,config:config,licence_type:req.user.licence_type});
   });


router.get('/exam/(:language)', ensureAuthenticated, async (req, res) =>{
console.log(req.user.licence_type)
 //console.log(answer);
 const config =await db.Config.findAll({});
 const [pm,pmmeta] =await db.sequelize.query(`select trainee_id,attempt_no ,sum(score) as pscore from PracticalMarks  where trainee_id ='${req.user.uniqueid}'
 group by testcode,trainee_id,attempt_no`);
 const [tm,tmmeta] = await db.sequelize.query(`select trainee_id,attempt_no_theory ,sum(theoretical_score) as tscore from TheoreticalMarks  where trainee_id ='${req.user.uniqueid}'
 group by trainee_id,attempt_no_theory`);
 if(req.params.language != "AMHARIC"){

  const [idArrayString,meta1] = await db.sequelize.query("SELECT GROUP_CONCAT(id SEPARATOR ',') "+
  "as id_array FROM QuestionBankOnes WHERE difficulty_level='Strong' and language_preference ='"+req.params.language+"'");
  // Assuming the id_array string is stored in a variable called idArrayString
  const idArrayStrings = meta1[0].id_array;
const idArray1 = idArrayStrings.split(',').map(id => parseInt(id));
  console.log(idArray1);
  const [idArrayString2,meta2] = await db.sequelize.query("SELECT GROUP_CONCAT(id SEPARATOR ',') "+
  "as id_array FROM QuestionBankOnes WHERE difficulty_level='Medium' and language_preference ='"+req.params.language+"'");
  // Assuming the id_array string is stored in a variable called idArrayString
  const idArrayStrings2 = meta2[0].id_array;
const idArray2 = idArrayStrings2.split(',').map(id => parseInt(id));


  const [idArrayString3,meta3] = await db.sequelize.query("SELECT GROUP_CONCAT(id SEPARATOR ',') "+
  "as id_array FROM QuestionBankOnes WHERE difficulty_level='Easy' and language_preference ='"+req.params.language+"'");
  // Assuming the id_array string is stored in a variable called idArrayString
  const idArrayStrings3 = meta3[0].id_array;
const idArray3 = idArrayStrings3.split(',').map(id => parseInt(id));
const result = [...idArray1, ...idArray2, ...idArray3];

const uniqueArray = [...new Set(result)];
console.log(result);

const shuffledArray = shuffleArray(uniqueArray);
const numItemsPerArray = Math.floor(50 / 3);
  
const resultArray = [
  ...shuffledArray.slice(0, numItemsPerArray),
  ...shuffledArray.slice(numItemsPerArray, numItemsPerArray * 2),
  ...shuffledArray.slice(numItemsPerArray * 2),
];

  while (resultArray.length < 50) {
    const remainingArray = getRemainingArray3(idArray1,idArray2,idArray3, resultArray);
  
    resultArray = resultArray.concat(remainingArray);
  }

  const genarray = resultArray.slice(0, 50);
  console.log(genarray)
  var currentDate = new Date();
db.Appointment.findOne({where:{appointment_date:{
  [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
  [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)

},appointment_tag:'Trainee',appointment_for:'Theoretical',trainee_id:req.user.uniqueid}})
.then(appointment =>{
if(appointment){
  
  db.QuestionBankOne.findAll(
    {where:{id: {
      [Op.in]: genarray
    }}}
  ).then(question =>{
    res.render('exam',{user:req.user,question:question});
}).catch(err => {
    res.render('exam',{user:req.user,question:''});
})
}else{
  res.render('dashboard',{language:req.params.language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Please Make Sure You Have Appointment To Take Theoretical Exam Contact Admin Assistance.'})
         
}
}).catch(err =>{
  res.render('dashboard',{language:req.params.language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Error While Trying Starting Exam. Network Error Please Take Exam Again.'})
         
})
 }else{


  const [idArrayString,meta1] = await db.sequelize.query("SELECT GROUP_CONCAT(id SEPARATOR ',') "+
  "as id_array FROM QuestionBankOnes WHERE difficulty_level='Strong' and language_preference ='"+req.params.language+"'");
  // Assuming the id_array string is stored in a variable called idArrayString
  const idArrayStrings = meta1[0].id_array;
const idArray1 = idArrayStrings.split(',').map(id => parseInt(id));
  console.log(idArray1);
  const [idArrayString2,meta2] = await db.sequelize.query("SELECT GROUP_CONCAT(id SEPARATOR ',') "+
  "as id_array FROM QuestionBankOnes WHERE difficulty_level='Medium' and language_preference ='"+req.params.language+"'");
  // Assuming the id_array string is stored in a variable called idArrayString
  const idArrayStrings2 = meta2[0].id_array;
const idArray2 = idArrayStrings2.split(',').map(id => parseInt(id));


  const [idArrayString3,meta3] = await db.sequelize.query("SELECT GROUP_CONCAT(id SEPARATOR ',') "+
  "as id_array FROM QuestionBankOnes WHERE difficulty_level='Easy' and language_preference ='"+req.params.language+"'");
  // Assuming the id_array string is stored in a variable called idArrayString
  const idArrayStrings3 = meta3[0].id_array;
const idArray3 = idArrayStrings3.split(',').map(id => parseInt(id));

const [idArrayString4,meta4] = await db.sequelize.query("SELECT GROUP_CONCAT(id SEPARATOR ',') "+
"as id_array FROM QuestionBankOnes WHERE course_category='BEHAVIOR' and language_preference ='"+req.params.language+"'");
// Assuming the id_array string is stored in a variable called idArrayString
const idArrayStrings4 = meta4[0].id_array;
const idArray4 = idArrayStrings3.split(',').map(id => parseInt(id));

const [idArrayString5,meta5] = await db.sequelize.query("SELECT GROUP_CONCAT(id SEPARATOR ',') "+
"as id_array FROM QuestionBankOnes WHERE course_category='TRAFFIC' and language_preference ='"+req.params.language+"'");
// Assuming the id_array string is stored in a variable called idArrayString
const idArrayStrings5 = meta5[0].id_array;
const idArray5 = idArrayStrings5.split(',').map(id => parseInt(id));

const [idArrayString6,meta6] = await db.sequelize.query("SELECT GROUP_CONCAT(id SEPARATOR ',') "+
"as id_array FROM QuestionBankOnes WHERE course_category='OHS' and language_preference ='"+req.params.language+"'");
// Assuming the id_array string is stored in a variable called idArrayString
const idArrayStrings6 = meta6[0].id_array;
const idArray6 = idArrayStrings6.split(',').map(id => parseInt(id));

const [idArrayString7,meta7] = await db.sequelize.query("SELECT GROUP_CONCAT(id SEPARATOR ',') "+
"as id_array FROM QuestionBankOnes WHERE course_category='TECHNIC' and language_preference ='"+req.params.language+"'");
// Assuming the id_array string is stored in a variable called idArrayString
const idArrayStrings7 = meta7[0].id_array;
const idArray7 = idArrayStrings7.split(',').map(id => parseInt(id));

const [idArrayString8,meta8] = await db.sequelize.query("SELECT GROUP_CONCAT(id SEPARATOR ',') "+
"as id_array FROM QuestionBankOnes WHERE course_category='DRIVING' and language_preference ='"+req.params.language+"'");
// Assuming the id_array string is stored in a variable called idArrayString
const idArrayStrings8 = meta8[0].id_array;
const idArray8 = idArrayStrings8.split(',').map(id => parseInt(id));
const arr1 =idArray1;
const arr2 =idArray2;
const arr3 =idArray3;
const arr4 =idArray4;
const arr5 =idArray5;
const arr6 =idArray6;
const arr7 =idArray7;
const arr8 =idArray8;
const shuffledArr1 = shuffleArray(arr1);
const shuffledArr2 = shuffleArray(arr2);
const shuffledArr3 = shuffleArray(arr3);
const shuffledArr4 = shuffleArray(arr4);
const shuffledArr5 = shuffleArray(arr5);
const shuffledArr6 = shuffleArray(arr6);
const shuffledArr7 = shuffleArray(arr7);
const shuffledArr8 = shuffleArray(arr8);


function generateArray() {
 

    
  const selectedItems = [
    ...shuffledArr1.slice(0, 3),
    ...shuffledArr2.slice(0, 2),
    ...shuffledArr3.slice(0, 3),
    ...shuffledArr4.slice(0, 13),
    ...shuffledArr5.slice(0, 9),
    ...shuffledArr6.slice(0, 3),
    ...shuffledArr7.slice(0, 10),
    ...shuffledArr8.slice(0, 7)
  ];
  
    const uniqueArray = [...new Set(selectedItems)];
    console.log(uniqueArray);
    //console.log(`Number of Array result: ${result}`);

   // console.log(uniqueArray);
    //console.log(`Number of Array uniqueArray: ${uniqueArray}`);

    const shuffledArray = shuffleArray(uniqueArray);
 //   console.log(`Number of Array shuffledArray: ${shuffledArray}`);
    const numItemsPerArray = Math.floor(50 / 6);
  
    var resultArray = [
      ...shuffledArray.slice(0, numItemsPerArray),
      ...shuffledArray.slice(numItemsPerArray, numItemsPerArray * 2),
      ...shuffledArray.slice(numItemsPerArray * 2, numItemsPerArray * 3),
      ...shuffledArray.slice(numItemsPerArray * 3, numItemsPerArray * 4),
      ...shuffledArray.slice(numItemsPerArray * 4, numItemsPerArray * 5),
      ...shuffledArray.slice(numItemsPerArray * 5, numItemsPerArray * 6),
      ...shuffledArray.slice(numItemsPerArray * 6, numItemsPerArray * 7),
      ...shuffledArray.slice(numItemsPerArray * 7),
    ];
    
      while (resultArray.length < 50) {
        const remainingArray = getRemainingArray(arr1, arr2, arr3, arr4, arr5, arr6,arr7,arr8, resultArray);
      
        resultArray = resultArray.concat(remainingArray);
      }
   
      const randomSample = resultArray.slice(0, 50);
      console.log(`Number of Array resultArray: ${resultArray}`);
      console.log(`Number of Array resultArray: ${resultArray.length}`);
      console.log(`Number of Array randomSample: ${randomSample}`);
      console.log(`Number of Array randomSample: ${randomSample.length}`);
    return randomSample;    
  }

  




  const generatedArray = generateArray();
  var currentDate = new Date();
db.Appointment.findOne({where:{appointment_date:{
  [Op.gte]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
  [Op.lt]: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)

},appointment_tag:'Trainee',appointment_for:'Theoretical',trainee_id:req.user.uniqueid}})
.then(appointment =>{
if(appointment){
  
  db.QuestionBankOne.findAll({where:{id: {
    [Op.in]: generatedArray
  }}}).then(question =>{
    res.render('exam',{user:req.user,question:question});
}).catch(err => {
    res.render('exam',{user:req.user,question:''});
})
}else{
  res.render('dashboard',{language:req.params.language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Please Make Sure You Have Appointment To Take Theoretical Exam Contact Admin Assistance.'})
         
}
}).catch(err =>{
  res.render('dashboard',{language:req.params.language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Error While Trying Starting Exam. Network Error Please Take Exam Again.'})
         
})
  
}

function getRemainingArray(arr1, arr2, arr3, arr4, arr5, arr6, arr7, arr8, resultArray) {
  let remainingArray = arr1.concat(arr2, arr3, arr4, arr5, arr6, arr7, arr8,);
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
function getRemainingArray3(arr1, arr2, arr3, resultArray) {
  let remainingArray = arr1.concat(arr2, arr3);
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
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

});


router.post('/submitthoreticaltehadso',ensureAuthenticated,async function(req,res){
 const{answer} = req.body;


 //console.log(answer);
 const config =await db.Config.findAll({});
 const [pm,pmmeta] =await db.sequelize.query(`select trainee_id,attempt_no ,sum(score) as pscore from PracticalMarks  where trainee_id ='${req.user.uniqueid}'
 group by testcode,trainee_id,attempt_no`);
 const [tm,tmmeta] = await db.sequelize.query(`select trainee_id,attempt_no_theory ,sum(theoretical_score) as tscore from TheoreticalMarks  where trainee_id ='${req.user.uniqueid}'
 group by trainee_id,attempt_no_theory`);
 const answers = JSON.parse(answer);
 let score = 0;
 const promises = answers.map(answer => {
  const questionId = Object.keys(answer)[0];
  const answerValue = answer[questionId];

  // Query the database for the correct answer for this question
  return db.QuestionBankOne.findOne({
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
});
const language = req.session.language;
const sql = "SELECT last_exam_post_date FROM Trainees WHERE uniqueid ='"+req.user.uniqueid+"'";
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
    tm_id: tm_id,
    trainee_id: req.user.uniqueid,
    theoretical_score: parseInt(score) *2,
    attempt_no_theory: parseInt(req.user.attempt_count) +1,
    trainee_testcode:req.user.trainee_code
  }
  const lastExamPostDate = result[0].last_exam_post_date;
  const today = new Date();
  const lastExamPostDatePlusOneDay = new Date(lastExamPostDate);
  lastExamPostDatePlusOneDay.setDate(lastExamPostDatePlusOneDay.getDate() + 1);

  if (today >= lastExamPostDatePlusOneDay) {
  db.TheoreticalMark.findOne({  where:{ trainee_id: req.user.uniqueid,
   
    attempt_no_theory: parseInt(req.user.attempt_count)}}).then((theoretical_mark) => {
      if(theoretical_mark ){
        db.Trainee.update({last_exam_post_date:new Date()},{where:{uniqueid:req.user.uniqueid}}).then(()=>{
             
        res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Error While Saving Your Score. This Attempt Already Saved.'})
        }).catch(err => {});
      
      }else{
            
        db.TheoreticalMark.create(theorymark).then(thmark =>{
          if(thmark){
            db.Trainee.update({last_exam_post_date:new Date(),attempt_count:parseInt(req.user.attempt_count )+1},{where:{uniqueid:req.user.uniqueid}}).then(()=>{
       
          res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'You Are Successfully Finish Examination. Your Score Is' +parseInt(score)*2})
        }).catch(err => {});
        }else{
            res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Error While Saving Your Score. Network Error Please Take Exam Again.'})
          
          }
      
        }).catch(err =>{
          console.log(err);
          
          res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'Error While Saving Your Score. Network Error Please Take Exam Again.'})
         
        })
      }
    });
  }else{
    res.render('dashboard',{language,pm:pm,tm:tm,user:req.user,config:config,licence_type:req.user.licence_type,successmsg:'You Have Already Posted An Exam Result Today'})
           
  }

});


})
router.get('/login', forwardAuthenticated, async (req, res) =>{
  res.render('login');
});


// Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/misaleacadamytehadso/login')

})

// Post Routers 

router.post('/login', (req, res, next) => {

  req.session.language = req.body.language;
  console.log( req.body.language)
  passport.authenticate('local', {
      successRedirect: '/misaleacadamytehadso/dashboard',
      failureRedirect: '/misaleacadamytehadso/login',
      failureFlash: true

  })(req, res, next);
});
module.exports = router;