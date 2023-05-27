const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/upload');

const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const passport = require('passport');
const EthiopianDate = require('ethiopian-date');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');
const db = require("../models")
const Op = db.Sequelize.Op;
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const PizZip = require('pizzip');
const fs = require('fs');
const Docxtemplater = require('docxtemplater');
const { saveAs } = require('file-saver');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const mime = require('mime-types');

const path = require('path');
const { error } = require('console');
router.post('/generate-documents-ash', async  function (req, res)  {
   const { round } = req.body;
 
   try {
      const templatePath = path.join(__dirname,'../public/template/ASH.docx');
      //download the template
     const content = await readFile(templatePath);
      //const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip);
   
       const [trainee, metadata] = await db.sequelize.query(
         `
         SELECT Trainees.uniqueid AS trainee_id,Trainees.ref_no,Trainees.fullname as name, Trainees.age, Trainees.gender,
  Trainees.trainee_code,Configs.config_name as category, 
            theoretical.attempt_no_theory, theoretical.theoretical_score as tscore,
            practical.attempt_no, practical.score as pscore
         FROM Trainees
         inner join Configs on Trainees.licence_type = Configs.config_id
         LEFT JOIN (
            SELECT trainee_id, attempt_no_theory, theoretical_score,
               ROW_NUMBER() OVER (PARTITION BY trainee_id ORDER BY theoretical_score DESC) AS theory_rank
            FROM TheoreticalMarks
         ) AS theoretical
         ON Trainees.uniqueid = theoretical.trainee_id AND theoretical.theory_rank = 1
         LEFT JOIN (
         SELECT trainee_id, testcode, MAX(attempt_no) AS attempt_no, SUM(score) AS score,
               ROW_NUMBER() OVER (PARTITION BY trainee_id ORDER BY SUM(score) DESC) AS practical_rank
         FROM PracticalMarks
         GROUP BY trainee_id, testcode
         ) AS practical
         ON Trainees.uniqueid = practical.trainee_id AND practical.practical_rank = 1
         where Trainees.pass_fail='PASS'
         ORDER BY Trainees.uniqueid;
         
         `
            );
            const today = new Date();
       const ethiopiany = EthiopianDate.toEthiopian(today.getFullYear(), today.getMonth() + 1, today.getDate())[0];
       const ethiopianm = EthiopianDate.toEthiopian(today.getFullYear(), today.getMonth() + 1, today.getDate())[1];
       const ethiopiand = EthiopianDate.toEthiopian(today.getFullYear(), today.getMonth() + 1, today.getDate())[2];

       db.Trainee.findAll({ where: { pass_fail: 'PASS',is_sentto_ash:'No' } })
  .then(trainees => {
   if (trainees) {
      trainees.forEach(trainee => {
         var idsToUpdate = trainee.id;
        db.Trainee.update( { round: round, is_sentto_ash:'Yes'},
        { where: { id: idsToUpdate } });
      });
    }
  })
  .then(numRowsUpdated => {
   const users = trainee.map((row,index) => ({
              
      id: index+1,
      name: row.name,
      category: row.category,
      tscore:row.tscore,
      pscore:row.pscore,
      refno:row.ref_no
    }));
doc.setData({users:users,
noofpass:users.length,
senddate:ethiopiand +"/"+ethiopianm+"/"+ethiopiany,
round:round,
latterno:"/"+ethiopianm+"/"+ethiopiany
});

doc.render();

const buffer = doc.getZip().generate({ type: 'nodebuffer' });

//download
res.set({
'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
'Content-Disposition': 'inline; filename="ASH.docx"',
'Content-Length': buffer.length
});

res.send(buffer);
  })
  .catch(error => {
    console.error(error);
  });
     
         
    } catch (error) {
      console.error(error);
      res.status(500).send('Error generating document');
    }

 });
 router.post('/printgradereport/(:traineeid)', ensureAuthenticated, async function(req, res) {
   
   const batch = db.Batch.findAll({})
   const config = db.Config.findAll({where:{config_type:'Education'}});
   
  const trainees = await  db.TraineeTrainer.findOne({where:{uniqueid:req.params.traineeid}})

  if(!trainees){
    res.render('deptprintgraduatedtottraineelist',{config:config,trainee:'',error_msg:'TOT Trainee Not Found!',user:req.user});

  }else{

     

       try {
         const course = await db.TOTCourses.findAll({where:{licence_type:trainees.licence_type}})
           var [c1,c2,c3,c4,f1,f2,f3,f4] = [0,0,0,0,0,0,0,0];
       
         const theoreticalresult = await db.TOTTraineeMark.findOne({where:{trainee_id:req.params.traineeid}});
         
         if(theoreticalresult && course.length >0){
            course.forEach(function(row){ 
               if(row.course_part ==="Final_1"){
                 f1 =((theoreticalresult.final_one)*100/14)* parseInt(row.course_weight)/100
              }else if(row.course_part ==="Continuous_2"){
               c2 =((theoreticalresult.continues_two)*100/10)* parseInt(row.course_weight)/100
              }else if(row.course_part ==="Continuous_3"){
               c3 =((theoreticalresult.continues_three)*100/14)* parseInt(row.course_weight)/100
              }else if(row.course_part ==="Continuous_4"){
               c4 =((theoreticalresult.continues_four)*100/14)* parseInt(row.course_weight)/100
              }else if(row.course_part ==="Continuous_1"){
               c1 =((theoreticalresult.continues_one)*100/10)* parseInt(row.course_weight)/100
              }else if(row.course_part ==="Final_2"){
               f2 =((theoreticalresult.final_two)*100/15)* parseInt(row.course_weight)/100
              }else if(row.course_part ==="Final_3"){
               f3 =((theoreticalresult.final_three)*100/21)* parseInt(row.course_weight)/100
              }else if(row.course_part ==="Final_4"){
               f4 =((theoreticalresult.final_four)*100/12)* parseInt(row.course_weight)/100
              }
            })
         }
        
        
         const [practicalresult, metadata1] = await db.sequelize.query(
       `
       SELECT TraineeTrainers.uniqueid,Batches.batch_name, TraineeTrainers.fullname, trainee_code,gender,age, TraineeTrainers.licence_type, 
       COALESCE(intrance.theory_result, 0) AS theory_result,
       COALESCE(intrance.practical_result, 0) AS practical_result,
       COALESCE(pmt1.score, 0) AS score1,
       COALESCE(pmt2.score, 0) AS score2,
       COALESCE(pmt3.score, 0) AS score3,
       COALESCE(pmt4.score, 0) AS score4,
       COALESCE(pmt5.score, 0) AS score5,
       COALESCE(pmt7.score, 0) AS score7,
       COALESCE(pmt6.score, 0) AS score6
       FROM TraineeTrainers 
       inner join Batches on TraineeTrainers.batch_id = Batches.batch_id
       LEFT JOIN IntranceExamResults AS intrance ON TraineeTrainers.uniqueid = intrance.trainee_id
       LEFT JOIN (
       SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Training' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
       FROM PracticalMarkTrainers
       GROUP BY trainee_id
       ) AS pmt1 ON TraineeTrainers.uniqueid = pmt1.trainee_id
       LEFT JOIN (
       SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Examining' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
       FROM PracticalMarkTrainers
       GROUP BY trainee_id
       ) AS pmt2 ON TraineeTrainers.uniqueid = pmt2.trainee_id
       LEFT JOIN (
          SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Presentation' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
          FROM PracticalMarkTrainers
          GROUP BY trainee_id
          ) AS pmt4 ON TraineeTrainers.uniqueid = pmt4.trainee_id
          LEFT JOIN (
             SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Obstacle_Course_Preparation' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
             FROM PracticalMarkTrainers
             GROUP BY trainee_id
             ) AS pmt5 ON TraineeTrainers.uniqueid = pmt5.trainee_id
             LEFT JOIN (
                SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Vehicle_Examination' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
                FROM PracticalMarkTrainers
                GROUP BY trainee_id
                ) AS pmt6 ON TraineeTrainers.uniqueid = pmt6.trainee_id
                LEFT JOIN (
                 SELECT trainee_id, SUM(CASE WHEN assessment_part = 'ExitExam' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
                 FROM PracticalMarkTrainers
                 GROUP BY trainee_id
                 ) AS pmt7 ON TraineeTrainers.uniqueid = pmt7.trainee_id
       LEFT JOIN (
       SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Project' THEN PracticalMarkTrainers.score ELSE 0 END)
       AS score
       FROM PracticalMarkTrainers
       GROUP BY trainee_id
       ) AS pmt3 ON TraineeTrainers.uniqueid = pmt3.trainee_id where is_registered='Yes' and is_graduated='Yes'  and TraineeTrainers.uniqueid='${req.params.traineeid}';
       
       
       
       `
          );
             var [classper,p1,p2,p3,p4] =[0,0,0,0,0];
          if(practicalresult.length >0){
            course.forEach(function(row){ 
               var practype = row.course_part ;
               var weight = row.course_weight;
               
              practicalresult.forEach(function(row){ 
               classper= parseInt(row.score3) +parseInt(row.score4);                
               if(practype === "Practical1"){
                  p1 = (row.score5)*weight/100;
             }else if(practype === "Practical2"){
              p2 = (row.score7)*weight/100;
             }else if(practype === "Practical3"){
              p3 = (row.score6)*weight/100;
             }else if(practype === "Practical4"){
              p4 = ((parseInt(row.score1) + parseInt(row.score2))/2)*weight/100;
             }
                
              } )
               })
          }
      
          var templatePath;
          if(course.length ===11){
            templatePath = path.join(__dirname,'../public/template/Auto.docx');
          }else if(course.length ===13){
            templatePath = path.join(__dirname,'../public/template/Hizb.docx');
          }else if(course.length ===12){
            templatePath = path.join(__dirname,'../public/template/Derek.docx');
          }
          
         //download the template
         const content = await readFile(templatePath);
         //const content = fs.readFileSync(templatePath, 'binary');
         const zip = new PizZip(content);
         const doc = new Docxtemplater(zip);
      
         
          const today = new Date();
          const ethiopiany = EthiopianDate.toEthiopian(today.getFullYear(), today.getMonth() + 1, today.getDate())[0];
          const ethiopianm = EthiopianDate.toEthiopian(today.getFullYear(), today.getMonth() + 1, today.getDate())[1];
          const ethiopiand = EthiopianDate.toEthiopian(today.getFullYear(), today.getMonth() + 1, today.getDate())[2];
     
          doc.setData({users:'',
          course1:f1.toFixed(2),
          course2:f2.toFixed(2),
          course3:c2.toFixed(2),
          course4:c1.toFixed(2),
          course5:c3.toFixed(2),
          course6:f3.toFixed(2),
          coursep1:p1.toFixed(2),
          course7:f4.toFixed(2),
          course8:c4.toFixed(2),
          ttotal :(f1+f2+f3+f4+c1+c2+c3+c4+p1).toFixed(2),
          coursep2:p2.toFixed(2),
          coursep3:p3.toFixed(2),
          coursep4:p4.toFixed(2),
          ptotal:(p2+p3+p4).toFixed(2),
          total:(f1+f2+f3+f4+c1+c2+c3+c4+p1+p2+p3+p4).toFixed(2),
          project:classper,
          senddate:ethiopiand +"/"+ethiopianm+"/"+ethiopiany,
          name:trainees.fullname,
          gender:trainees.gender,
          latterno:"/"+ethiopianm+"/"+ethiopiany
          });
          
          doc.render();
          
          const buffer = doc.getZip().generate({ type: 'nodebuffer' });
          
          //download
          res.set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'inline; filename="GradeReport.docx"',
          'Content-Length': buffer.length
          });
          
          res.send(buffer);
        
            
       } catch (error) {
         console.error(error);
         res.status(500).send('Error generating document');
       }
    }
}); 
router.get('/getcertificate',ensureAuthenticated,async function(req,res){
   const templateContent = fs.readFileSync(path.join(__dirname,'../public/template/simple.docx'));
const template = new Docxtemplater(templateContent);

const data = { 'name': 'John Doe', 'email': 'john.doe@example.com' };
const content = ejs.render(fs.readFileSync('template.ejs', 'utf-8'), data);

template.setData({ content });
template.render();
const output = template.getZip().generate({ type: 'nodebuffer' });
fs.writeFileSync('output.docx', output);
})
router.post('/deptaddbatch', ensureAuthenticated, async function(req, res) {

   const {batchname} =req.body;

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
   const fail = await db.Trainee.count({where:{pass_fail:'Failed'}});
   const pass = await db.Trainee.count({where:{pass_fail:'Passed'}});
   let errors =[];

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

   const v1options = {
      node: [0x01, 0x23],
      clockseq: 0x1234,
      msecs: new Date('2011-11-01').getTime(),
      nsecs: 5678,
    };
    batchid = uuidv4(v1options);
   if( !batchname){
     errors.push({msg:'Please Enter Batch Name Feild Value'})
   }
   if(errors.length>0){
      
      res.render('dashboarddept',{errors,user:req.user, pass:pass,fail:fail,alltrainee:alltrainee,
         alltraineepayed:alltraineepayed,regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,
         alltraineetakeexam:alltraineetakeexam});
   }else{
       const batch ={
         batch_id: batchid,
         batch_name: batchname,
         is_current:'Yes'
       }
       db.Batch.findOne({where:{batch_name:batchname}}).then(con=>{
         if(con){
            res.render('dashboarddept',{user:req.user, pass:pass,fail:fail,alltrainee:alltrainee,
               alltraineepayed:alltraineepayed,regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,
               alltraineetakeexam:alltraineetakeexam,error_msg:'Batch With Name Already Create Exists'});
         
         }else{
            db.Batch.create(batch).then(config =>{
               if(config){
                  res.render('dashboarddept',{ pass:pass,fail:fail,alltrainee:alltrainee,
                     alltraineepayed:alltraineepayed,regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,
                     alltraineetakeexam:alltraineetakeexam,user:req.user,success_msg:'Create New Batch Successfully'});
               }else{
                  res.render('dashboarddept',{ pass:pass,fail:fail,alltrainee:alltrainee,
                     alltraineepayed:alltraineepayed,regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,
                     alltraineetakeexam:alltraineetakeexam,user:req.user,error_msg:'Cant Create Batch'});
               }
             }).catch(err =>{
               res.render('dashboarddept',{ pass:pass,fail:fail,alltrainee:alltrainee,
                  alltraineepayed:alltraineepayed,regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,
                  alltraineetakeexam:alltraineetakeexam,user:req.user,error_msg:'Cant Create Batch'});
             })
         }
       })
    
     
   }
  
  });
router.post('/updatepassword', ensureAuthenticated, async function(req, res) {

const {oldpassword,newpassword,renewpassword} =req.body;

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
const fail = await db.Trainee.count({where:{pass_fail:'Failed'}});
const pass = await db.Trainee.count({where:{pass_fail:'Passed'}});
let errors =[];

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

const v1options = {
   node: [0x01, 0x23],
   clockseq: 0x1234,
   msecs: new Date('2011-11-01').getTime(),
   nsecs: 5678,
   };
   batchid = uuidv4(v1options);
if( !oldpassword || !renewpassword || !newpassword){
   errors.push({msg:'Please Enter  All Feild Value'})
}
if(errors.length>0){
   
   res.render('dashboarddept',{errors,user:req.user, pass:pass,fail:fail,alltrainee:alltrainee,
      alltraineepayed:alltraineepayed,regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,
      alltraineetakeexam:alltraineetakeexam});
}else{
   bcrypt.compare(oldpassword, req.user.password, (err, isMatch) => {
      if (err) throw err;
      if (isMatch) {
         if(newpassword  == renewpassword){
         bcrypt.hash(newpassword, 10, (err, hash) => {
            

            db.User.update({password:hash},{where:{id:req.user.id}}).then(usernew =>{
               res.redirect('/misaleacadamy/logout')
               }).catch(err =>{
                  console.log(err)
                  res.render('dashboarddept',{error_msg:'Cant Change Password Now Try Later',user:req.user, pass:pass,fail:fail,alltrainee:alltrainee,
                  alltraineepayed:alltraineepayed,regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,
                  alltraineetakeexam:alltraineetakeexam});   
               
               })
            }); // 
         
         }else{
         res.render('dashboarddept',{error_msg:'Retype Password Not Match',user:req.user, pass:pass,fail:fail,alltrainee:alltrainee,
         alltraineepayed:alltraineepayed,regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,
         alltraineetakeexam:alltraineetakeexam});
         }
      } else {
         res.render('dashboarddept',{error_msg:'Old Passwod Not Correct',user:req.user, pass:pass,fail:fail,alltrainee:alltrainee,
            alltraineepayed:alltraineepayed,regarray:regarray,examarray:examarray,passarray:passarray,failarray:failarray,
            alltraineetakeexam:alltraineetakeexam});
   
      }
      });
   


   
   
}

});
router.get('/deptallbatchlist',ensureAuthenticated,async function(req,res){
   const batch = await  db.Batch.findAll({});
   console.log(batch);
   res.render('deptallbatchlist',{batch:batch,user:req.user})
})
router.post('/updatebatchiscurrent/(:batchid)',ensureAuthenticated,async function(req,res){
   const batchold = await  db.Batch.findAll({});
   db.Batch.findOne({where:{batch_id:req.params.batchid}}).then(batch =>{
   if(batch){
      const newIsCurrent = batch.is_current === 'Yes' ? 'No' : 'Yes';

  db.Batch.update(
   { is_current:newIsCurrent},
 
   {where:{batch_id:req.params.batchid}}).then(batch =>{
   db.Batch.findAll({}).then(newbatch =>{
      res.render('deptallbatchlist',{batch:newbatch,user:req.user,success_msg:'Successfully Updating Batch Info'})
 
   })
  }).catch(err =>{
   res.render('deptallbatchlist',{batch:batchold,user:req.user,error_msg:'Error While Updating Batch Info'})

  })
   }else{
      res.render('deptallbatchlist',{batch:batchold,user:req.user,error_msg:'Error Cant Find Batch Info'})
 
   }
   }).catch(err =>{
      res.render('deptallbatchlist',{batch:batchold,user:req.user,error_msg:'Error While Updating Batch Info'})
   })
  
})
router.get('/deptaddnewquestion', ensureAuthenticated, async function(req, res) {

   db.Config.findAll({}).then(config =>{
      res.render('deptaddnewquestion',{config:config,user:req.user});
   }).catch(err=>{
      res.render('deptaddnewquestion',{config:'',user:req.user});
   })
  
 });
 router.get('/deptallquestionlist', ensureAuthenticated, async function(req, res) {
    
    db.QuestionBankOne.findAll({}).then(question =>{
      res.render('deptallquestionlist',{user:req.user,question:question});
   }).catch(err =>{
      res.render('deptallquestionlist',{user:req.user,question:''});
   })
   });
   router.get('/help',ensureAuthenticated,async function(req,res){
      res.render('help',{user:req.user})
   })
   router.get('/deptalltrainerquestionlist', ensureAuthenticated, async function(req, res) {
     
      const config = await db.Config.findAll({where:{config_type:'Education'}})
      db.TrainerQuestionBank.findAll({}).then(question =>{
        res.render('deptalltrainerquestionlist',{config:config,user:req.user,question:question});
     }).catch(err =>{
        res.render('deptalltrainerquestionlist',{config:config,user:req.user,question:''});
     })
     });


   router.get('/deptnewassessements', ensureAuthenticated, async function(req, res) {
   db.Config.findAll({}).then(config =>{
      res.render('deptnewassessements',{config:config,user:req.user});
   }).catch(err=>{
      res.render('deptnewassessements',{config:'',user:req.user});
   })
   });
   
router.get('/deptaddtrainerassessement/(:type)', ensureAuthenticated, async function(req, res) {
db.Config.findAll({}).then(config =>{
res.render('deptaddtrainerquestion',{asstype:req.params.type,config:config,user:req.user});
}).catch(err=>{
res.render('deptaddtrainerquestion',{asstype:req.params.type,config:'',user:req.user});
})
});

router.get('/depthisweekschedule', ensureAuthenticated, async function(req, res) {
const [schedule,metadata] = await db.sequelize.query("Select * from Schedules inner join Staffs on "+
" Schedules.staff_id = Staffs.staff_id where schedule_type='Tehadso'")
db.Config.findAll({}).then(config =>{
res.render('depthisweekschedule',{schedule:schedule,config:config,user:req.user});
}).catch(err=>{
res.render('depthisweekschedule',{schedule:schedule,config:'',user:req.user});
})
});
router.get('/depthisweekscheduletot', ensureAuthenticated, async function(req, res) {
const [schedule,metadata] = await db.sequelize.query(`
SELECT 
t.staff_id,
t.full_name,
b.batch_name,
JSON_ARRAYAGG(JSON_OBJECT('schedule_id', s.id, 'schedule_date', s.from_date, 'schedule_type', s.technical_part)) AS schedule_data

FROM 
Staffs t
JOIN 
Schedules s ON t.staff_id = s.staff_id
JOIN 
Batches b ON b.batch_id = s.batch_id
WHERE
s.schedule_type = 'TOT' and b.is_current = 'Yes'
GROUP BY 
t.staff_id,t.full_name, b.batch_name
ORDER BY 
t.staff_id;
`)
db.Config.findAll({}).then(config =>{
   res.render('depthisweekscheduletot',{schedule:schedule,config:config,user:req.user});
}).catch(err=>{
   res.render('depthisweekscheduletot',{schedule:schedule,config:'',user:req.user});
})
});
router.get('/deptallassessment', ensureAuthenticated, async function(req, res) {
//const assessment = await db.PracticalAssessment.findAll({});
const [assessment,totcoursemeta] = await db.sequelize.query("select * from PracticalAssessments"+
" inner join Configs on PracticalAssessments.education = Configs.config_id");
const [course,coursemeta] = await db.sequelize.query("select config_id,config_name from Configs where config_type='Education'" );

db.Config.findAll({}).then(config =>{
res.render('deptallassessment',{assessment:assessment,course:course,config:config,user:req.user});
}).catch(err=>{
res.render('deptallassessment',{assessment:assessment,config:'',user:req.user});
})
});

router.get('/deleteassessement/(:assid)', ensureAuthenticated, async function(req, res) {
//const assessment = await db.PracticalAssessment.findAll({});
const [assessment,totcoursemeta] = await db.sequelize.query("select * from PracticalAssessments"+
" inner join Configs on PracticalAssessments.education = Configs.config_id");
const [course,coursemeta] = await db.sequelize.query("select config_id,config_name from Configs where config_type='Education'" );

db.PracticalAssessment.destroy({where:{a_id:req.params.assid}}).then(dlt =>{
   db.Config.findAll({}).then(config =>{
      res.render('deptallassessment',{assessment:assessment,course:course,config:config,user:req.user});
      }).catch(err=>{
      res.render('deptallassessment',{assessment:assessment,config:'',user:req.user});
      })
}).catch(err =>{
   res.render('deptallassessment',{assessment:assessment,config:'',user:req.user});
   
})

});
router.get('/deleteassessementtot/(:assid)', ensureAuthenticated, async function(req, res) {
//const assessment = await db.PracticalAssessment.findAll({});

db.PracticalAssessmentTrainer.destroy({where:{a_id:req.params.assid}}).then(dlt =>{
db.PracticalAssessmentTrainer.findAll({}).then(assessment =>{
   db.Config.findAll({}).then(config =>{
      res.render('deptallassessmenttrainerpracticallist',{assessment:assessment,config:config,user:req.user});
      }).catch(err=>{
      res.render('deptallassessmenttrainerpracticallist',{assessment:assessment,config:'',user:req.user});
      })
}).catch(err =>{
   res.render('deptallassessmenttrainerpracticallist',{assessment:assessment,config:'',user:req.user});
   
})

}).catch(err =>{
res.render('deptallassessmenttrainerpracticallist',{assessment:assessment,config:'',user:req.user});

})

});
router.get('/deptallassessmenttrainerpracticallist', ensureAuthenticated, async function(req, res) {
const assessment = await db.PracticalAssessmentTrainer.findAll({});
db.Config.findAll({}).then(config =>{
res.render('deptallassessmenttrainerpracticallist',{assessment:assessment,config:config,user:req.user});
}).catch(err=>{
res.render('deptallassessmenttrainerpracticallist',{assessment:assessment,config:'',user:req.user});
})
});
router.get('/deptassessementsreport', ensureAuthenticated, async function(req, res) {
res.render('deptassessementsreport',{user:req.user});
});
router.get('/deptaddassossorschedule', ensureAuthenticated, async function(req, res) {

const [staff,metadata] =await db.sequelize.query("select Staffs.full_name,Staffs.phone_no,Users.staffid from Users inner join Staffs on Users.staffid = Staffs.staff_id where "+
"Users.user_roll  = 'Assessor' and Users.is_active='Yes'");
db.Config.findAll({where:{config_type:"Education"}}).then(config =>{
res.render('deptaddassossorschedule',{user:req.user,staff:staff,config:config});
}).catch(err =>{
res.render('deptaddassossorschedule',{user:req.user,staff:'',config:config});
})
});
router.get('/deptaddassossorscheduletot', ensureAuthenticated, async function(req, res) {

const [staff,metadata] =await db.sequelize.query("select Staffs.full_name,Staffs.phone_no,Users.staffid from Users inner join Staffs on Users.staffid = Staffs.staff_id where "+
"Users.user_roll  = 'Assessor' and Users.is_active='Yes'");
const batch = await db.Batch.findAll()
db.Config.findAll({where:{config_type:"Education"}}).then(config =>{
res.render('deptaddassossorscheduletot',{batch:batch, user:req.user,staff:staff,config:config});
}).catch(err =>{
res.render('deptaddassossorscheduletot',{batch:batch,user:req.user,staff:'',config:config});
})
});

router.get('/deptothereport', ensureAuthenticated, async function(req, res) {
res.render('deptothereport',{user:req.user});
});
router.get('/deptstatistics', ensureAuthenticated, async function(req, res) {
res.render('deptstatistics',{user:req.user});
});

router.get('/deptallnewtraineetrainer', ensureAuthenticated, async function(req, res) {
const [trainee, metadata] = await db.sequelize.query(
"SELECT * FROM TraineeTrainers where  is_selected='No' order by createdAt asc"
);
const config= await  db.Config.findAll();
res.render('deptallnewtraineetrainer',{user:req.user,trainee:trainee,config:config});


}); 
router.get('/deptaddnewtotcourse',ensureAuthenticated,async function(req,res){
const config = await db.Config.findAll({where:{config_type:'Education'}})
res.render('deptaddnewtotcourse',{user:req.user,config:config})
}); 
router.get('/deptalltotcourselist',ensureAuthenticated,async function(req,res){
const [totcourse,totcoursemeta] = await db.sequelize.query("select * from TOTCourses"+
" inner join Configs on TOTCourses.licence_type = Configs.config_id");
const [course,coursemeta] = await db.sequelize.query("select config_id,config_name from Configs where config_type='Education'" );
res.render('deptalltotcourselist',{user:req.user,totcourse:totcourse,course:course})
});
router.post('/deletetotcourse/(:cid)',ensureAuthenticated,async function(req,res){
   const [totcourse,totcoursemeta] = await db.sequelize.query("select * from TOTCourses"+
   " inner join Configs on TOTCourses.licence_type = Configs.config_id");
   const [course,coursemeta] = await db.sequelize.query("select config_id,config_name from Configs where config_type='Education'" );
   db.TOTCourses.findOne({where:{c_id:req.params.cid}}).then(course =>{
      if(course){
         db.TOTCourses.destroy({where:{c_id:req.params.cid}}).then(dtc =>{
            res.render('deptalltotcourselist',{success_msg:'Successfully Delete Now TOT Course',user:req.user,totcourse:totcourse,course:course})

         }).catch(err => {
            res.render('deptalltotcourselist',{error_msg:'Cant Delete Now Try Again',user:req.user,totcourse:totcourse,course:course})

         });
      }else{
         res.render('deptalltotcourselist',{error_msg:'TOT Course With This ID Not Found',user:req.user,totcourse:totcourse,course:course})

      }

   }).catch(err => {
      res.render('deptalltotcourselist',{error_msg:'Cant Delete Now Try Again',user:req.user,totcourse:totcourse,course:course})

   });
})
router.post('/addnewtotcourse',ensureAuthenticated,async function(req,res){
const {coursename,coursetype,coursecode,courseweight,courseeducation,coursepart} =req.body;
const config = await db.Config.findAll({where:{config_type:'Education'}})
let errors = [];
if(!coursecode || !courseeducation || !coursename ||!coursepart ||!courseweight || !coursetype){
errors.push({msg:'Please Select All Required feilds'})
}
if(courseeducation == "0"){
errors.push({mgs:'Please Select Education Category'})
}
if(coursepart == "0"){
errors.push({mgs:'Please Select Course Part'})
}
if(coursetype == "0"){
errors.push({mgs:'Please Select Course Type'})
}
if(errors.length >0){
res.render('deptaddnewtotcourse',{user:req.user,config:config,errors})
}else{
const v1options = {
node: [0x01, 0x23],
clockseq: 0x1234,
msecs: new Date('2011-11-01').getTime(),
nsecs: 5678,
};

cid = uuidv4(v1options);
const coursetot ={
c_id: cid,
course_code: coursecode,
licence_type:courseeducation,
course_weight:courseweight,
course_name: coursename,
course_type:coursetype,
course_part: coursepart
} 
db.TOTCourses.findOne({where:{course_code:coursecode,licence_type:courseeducation}}).then(totcourse =>{
if(totcourse){
res.render('deptaddnewtotcourse',{user:req.user,config:config,error_msg:'Error While Creating TOT Course Already Registered!'})

}else{
db.TOTCourses.create(coursetot).then(newcourse =>{
res.render('deptaddnewtotcourse',{user:req.user,config:config,success_msg:'New TOT Course Created Successfully'})
}).catch(err =>{
res.render('deptaddnewtotcourse',{user:req.user,config:config,error_msg:'Error While Creating TOT Course Please Try Again'})

})
}
}).catch(err =>{
res.render('deptaddnewtotcourse',{user:req.user,config:config,error_msg:'Error While Creating TOT Course Please Try Again'})

})
}

});
router.get('/depttotregisteredstudentsselectbatch', ensureAuthenticated, async function(req, res) {
 
   const batch= await  db.Batch.findAll({where:{is_current:'Yes'}});
/* The above code is rendering a view called "depttotregisteredstudentsselectbatch" and passing two
variables to it: "batch" and "user". The "batch" variable contains some data related to a batch, and
the "user" variable contains information about the current user. This code is likely part of a
larger web application built using the Node.js and Express.js frameworks. */
res.render('depttotregisteredstudentsselectbatch',{batch:batch,user:req.user});


}); 

router.post('/depttraineetrainerregisteredstudents', ensureAuthenticated, async function(req, res) {
   
    const {batchid} =req.body;
    const batch= await  db.Batch.findAll({where:{is_current:'Yes'}});
    if(batchid ==="0"){
      res.render('depttotregisteredstudentsselectbatch',{error_msg:'Please Select Batch Name',batch:batch,user:req.user});

    }else{

   
   
   const trainee= await db.TraineeTrainer.findAll({where:{batch_id:batchid}});
const config= await  db.Config.findAll();
res.render('depttraineetrainerregisteredstudents',{user:req.user,trainee:trainee,config:config});

      }
}); 
router.post('/showtotdetailmarklistresult/(:traineeid)', ensureAuthenticated, async function(req, res) {
   
    const batch = db.Batch.findAll({})
    const config = db.Config.findAll({where:{config_type:'Education'}});
    
   const trainees = await  db.TraineeTrainer.findOne({where:{uniqueid:req.params.traineeid}})
 
   if(!trainees){
     res.render('depttotsinglestudentmarklist',{theoreticalresult:'',config:config,course:'',practicalresult:'',batch:batch,trainees:'',error_msg:'TOT Trainee Not Found!',user:req.user});

   }else{

     const course = await db.TOTCourses.findAll({where:{licence_type:trainees.licence_type}})
      const theoreticalresult = await db.TOTTraineeMark.findOne({where:{trainee_id:req.params.traineeid}});
  const [practicalresult, metadata] = await db.sequelize.query(
     `
     SELECT TraineeTrainers.uniqueid,Batches.batch_name, TraineeTrainers.fullname, trainee_code,gender,age, TraineeTrainers.licence_type, 
     COALESCE(intrance.theory_result, 0) AS theory_result,
     COALESCE(intrance.practical_result, 0) AS practical_result,
     COALESCE(pmt1.score, 0) AS score1,
     COALESCE(pmt2.score, 0) AS score2,
     COALESCE(pmt3.score, 0) AS score3,
     COALESCE(pmt4.score, 0) AS score4,
     COALESCE(pmt5.score, 0) AS score5,
     COALESCE(pmt7.score, 0) AS score7,
     COALESCE(pmt6.score, 0) AS score6
     FROM TraineeTrainers 
     inner join Batches on TraineeTrainers.batch_id = Batches.batch_id
     LEFT JOIN IntranceExamResults AS intrance ON TraineeTrainers.uniqueid = intrance.trainee_id
     LEFT JOIN (
     SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Training' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
     FROM PracticalMarkTrainers
     GROUP BY trainee_id
     ) AS pmt1 ON TraineeTrainers.uniqueid = pmt1.trainee_id
     LEFT JOIN (
     SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Examining' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
     FROM PracticalMarkTrainers
     GROUP BY trainee_id
     ) AS pmt2 ON TraineeTrainers.uniqueid = pmt2.trainee_id
     LEFT JOIN (
        SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Presentation' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
        FROM PracticalMarkTrainers
        GROUP BY trainee_id
        ) AS pmt4 ON TraineeTrainers.uniqueid = pmt4.trainee_id
        LEFT JOIN (
           SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Obstacle_Course_Preparation' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
           FROM PracticalMarkTrainers
           GROUP BY trainee_id
           ) AS pmt5 ON TraineeTrainers.uniqueid = pmt5.trainee_id
           LEFT JOIN (
              SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Vehicle_Examination' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
              FROM PracticalMarkTrainers
              GROUP BY trainee_id
              ) AS pmt6 ON TraineeTrainers.uniqueid = pmt6.trainee_id
              LEFT JOIN (
               SELECT trainee_id, SUM(CASE WHEN assessment_part = 'ExitExam' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
               FROM PracticalMarkTrainers
               GROUP BY trainee_id
               ) AS pmt7 ON TraineeTrainers.uniqueid = pmt7.trainee_id
     LEFT JOIN (
     SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Project' THEN PracticalMarkTrainers.score ELSE 0 END)
     AS score
     FROM PracticalMarkTrainers
     GROUP BY trainee_id
     ) AS pmt3 ON TraineeTrainers.uniqueid = pmt3.trainee_id where is_registered='Yes'  and TraineeTrainers.uniqueid='${req.params.traineeid}';
     
     
     
     `
        );
const config= await  db.Config.findAll();
res.render('depttotsinglestudentmarklist',{theoreticalresult:theoreticalresult,config:config,course:course,practicalresult:practicalresult,batch:batch,user:req.user,trainees:trainees,config:config});

     }
}); 
router.post('/selectnewtotapplicant/(:totid)',ensureAuthenticated,async function(req,res){
const totid = req.params.totid;
const [trainee, metadata] = await db.sequelize.query(
"SELECT * FROM TraineeTrainers where  is_selected='No' order by createdAt desc"
);
const config= await  db.Config.findAll();
db.TraineeTrainer.findOne({where:{uniqueid:totid}}).then(tot =>{
if(tot){
db.TraineeTrainer.update({is_selected:'Yes'},{where:{uniqueid:totid}}).then(uddttot =>{
db.TraineeTrainer.findAll({where:{is_selected:'No'}}).then(trainee =>{
if(trainee){
res.render('deptallnewtraineetrainer',{trainee:trainee,config:config,user:req.user,success_msg:'Successfully Update New TOT Trainee Applicant Status :Selected To Take Intrance Exam'})

}
}).catch(err =>{});
}).catch(err =>{
res.render('deptallnewtraineetrainer',{trainee:trainee,config:config,user:req.user,error_msg:'Network Error While Update TOT Trainee Status Try Again'})

})
}else{
res.render('deptallnewtraineetrainer',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Find Registered New TOT Trainee With This ID'})
}
}).catch(err =>{
res.render('deptallnewtraineetrainer',{trainee:trainee,config:config,user:req.user,error_msg:'Cant Update New ToT Trainee Status Noe'})
})
})
router.post('/deptsaveassstaffschedule', ensureAuthenticated, async function(req, res) {

const {staffid,fromdate,technicianpart} =req.body;
const [staff,metadata] =await db.sequelize.query("select Staffs.full_name,Staffs.phone_no,Users.staffid from Users inner join Staffs on Users.staffid = Staffs.staff_id where "+
"Users.user_roll  = 'Assessor' and Users.is_active='Yes'");
const config = await db.Config.findAll({where:{config_type:"Education"}});
let errors =[];
const v1options = {
node: [0x01, 0x23],
clockseq: 0x1234,
msecs: new Date('2011-11-01').getTime(),
nsecs: 5678,
};
configid = uuidv4(v1options);
if(!staffid || !fromdate || !technicianpart){
errors.push({msg:'Please Enter Required Feild Values'})
}
if(technicianpart=="0"){
errors.push({msg:'Please Select Technical Part'})
}
if(errors.length>0){

res.render('deptaddassossorschedule',{staff:staff,config:config,errors,user:req.user});
}else{
const scheduleData ={
staff_id:staffid,
from_date:new Date(fromdate),

technical_part: technicianpart,
schedule_type:'Tehadso'
}
db.Schedule.findOne({  where: {
staff_id:staffid, schedule_type:'Tehadso'
}}).then(con=>{
if(con){
db.Schedule.update(scheduleData,{where:{ staff_id:staffid}}).then(scheduleudt =>{
if(scheduleudt){
res.render('deptaddassossorschedule',{staff:staff,config:config,user:req.user,success_msg:'Schedule Created Successfully'});
}else{
res.render('deptaddassossorschedule',{staff:staff,config:config,user:req.user,error_msg:'Cant Create Schedule '});
}
}).catch(err =>{
res.render('deptaddassossorschedule',{staff:staff,config:config,user:req.user,error_msg:'Cant Create Schedule'});
})
}else{
db.Schedule.create(scheduleData).then(schedule =>{
if(schedule){
res.render('deptaddassossorschedule',{staff:staff,config:config,user:req.user,success_msg:'Schedule Created Successfully'});
}else{
res.render('deptaddassossorschedule',{staff:staff,config:config,user:req.user,error_msg:'Cant Create Schedule '});
}
}).catch(err =>{
res.render('deptaddassossorschedule',{staff:staff,config:config,user:req.user,error_msg:'Cant Create Schedule'});
})
}
})


}

});
router.post('/deptsaveassstaffscheduletot', ensureAuthenticated, async function(req, res) {

const {staffid,fromdate,technicianpart,batchname} =req.body;
const [staff,metadata] =await db.sequelize.query("select Staffs.full_name,Staffs.phone_no,Users.staffid from Users inner join Staffs on Users.staffid = Staffs.staff_id where "+
"Users.user_roll  = 'Assessor' and Users.is_active='Yes'");
const config = await db.Config.findAll({where:{config_type:"Education"}});
const batch  = await db.Batch.findAll()

let errors =[];
const v1options = {
node: [0x01, 0x23],
clockseq: 0x1234,
msecs: new Date('2011-11-01').getTime(),
nsecs: 5678,
};
configid = uuidv4(v1options);
if(!staffid  || !technicianpart ||!batchname){
errors.push({msg:'Please Enter Required Feild Values'})
}
if(technicianpart=="0"){
errors.push({msg:'Please Select WBD'})
}
if(batchname=="0"){
errors.push({msg:'Please Select Batch Name'})
}
if(errors.length>0){

res.render('deptaddassossorscheduletot',{batch:batch,staff:staff,config:config,errors,user:req.user});
}else{
const scheduleData ={
staff_id:staffid,
from_date:new Date(),
batch_id:batchname,
technical_part: technicianpart,
schedule_type:'TOT'
}  
db.Schedule.findOne({  where: {
staff_id:staffid, schedule_type:'TOT',batch_id:batchname,technical_part: technicianpart
}}).then(con=>{
if(con){
db.Schedule.update(scheduleData,{where:{ staff_id:staffid}}).then(scheduleudt =>{
if(scheduleudt){
res.render('deptaddassossorscheduletot',{batch:batch,staff:staff,config:config,user:req.user,success_msg:'WBD Created Successfully'});
}else{
res.render('deptaddassossorscheduletot',{batch:batch,staff:staff,config:config,user:req.user,error_msg:'Cant Create WBD '});
}
}).catch(err =>{
res.render('deptaddassossorscheduletot',{batch:batch,staff:staff,config:config,user:req.user,error_msg:'Cant Create WBD'});
})
}else{
db.Schedule.create(scheduleData).then(schedule =>{
if(schedule){
res.render('deptaddassossorscheduletot',{batch:batch,staff:staff,config:config,user:req.user,success_msg:'WBD Created Successfully'});
}else{
res.render('deptaddassossorscheduletot',{batch:batch,staff:staff,config:config,user:req.user,error_msg:'Cant Create WBD '});
}
}).catch(err =>{
res.render('deptaddassossorscheduletot',{batch:batch,staff:staff,config:config,user:req.user,error_msg:'Cant Create WBD'});
})
}
})


}

});
router.post('/deptaddnewquestion', ensureAuthenticated, async function(req, res) {

const {question,choicea,langpre,choiceb,choicec,choiced,answer,education,course,difficulty_level} =req.body;
let errors =[];
const v1options = {
node: [0x01, 0x23],
clockseq: 0x1234,
msecs: new Date('2011-11-01').getTime(),
nsecs: 5678,
};
const config = await db.Config.findAll({});
qid = uuidv4(v1options);
console.log(req.body)
if(!question ||! langpre || !choicea || !choiceb || !choicec || !choiced || !answer || !education || !course ||!difficulty_level){
errors.push({msg:'Please Enter  All Required Feild Value'})
}
if(langpre =="0"){
errors.push({msg:'Please Select Language'})
}
if(answer =="0"){
errors.push({msg:'Please Select Answer'})
}
var difficulty;
if(difficulty_level){
if(difficulty_level=="1"){
difficulty ="Easy";
}else if(difficulty_level=="2"){
difficulty ="Medium";
}else if(difficulty_level=="3"){
difficulty ="Strong";

}
}
if(errors.length>0){

res.render('deptaddnewquestion',{user:req.user,errors,config:config});
}else{
const questiondata ={
q_id: qid,
question:question,

question_choiceA: choicea,
question_choiceB:choiceb,
question_choiceC:choicec,
question_choiceD:choiced,
answer: answer,
language_preference:langpre,
difficulty_level:difficulty,
course_category: course,
education_category:education,
added_by: req.user.staffid,
is_active: 'Yes'
}
db.QuestionBankOne.create(questiondata).then(configs =>{
if(configs){
res.render('deptaddnewquestion',{user:req.user,config:config,success_msg:'New Question Add To Bank Successfully'});
}else{
res.render('deptaddnewquestion',{user:req.user,config:config,error_msg:'Cant Add Question'});
}
}).catch(err =>{
res.render('deptaddnewquestion',{user:req.user,config:config,error_msg:'Cant Create Question'});
})


}

}); 
router.get('/deptintranceexamresults',ensureAuthenticated,async function(req,res){
//  const {batchname} =req.body ;
const [trainee, metadata] = await db.sequelize.query(
" SELECT * FROM TraineeTrainers inner join "+
" IntranceExamResults on trainee_id=uniqueid "+

" where  is_selected='Yes' and  tobe_registered IS NULL"
);
const config= await  db.Config.findAll();
res.render('deptintranceexamresults',{user:req.user,trainee:trainee,config:config});

});
router.post('/sendapplicanttoregisternewtot/(:traineeid)',ensureAuthenticated,async function(req,res) {
const config= await  db.Config.findAll();
const [trainee, metadata] = await db.sequelize.query(
" SELECT * FROM TraineeTrainers inner join "+
" IntranceExamResults on trainee_id=uniqueid "+

" where  is_selected='Yes' and recept_no_intrance IS NOT NULL and tobe_registered IS NULL"
);
db.TraineeTrainer.findOne({where:{uniqueid:req.params.traineeid}}).then(tr =>{
if(tr){
db.TraineeTrainer.update({tobe_registered:'Yes'},{where:{uniqueid:req.params.traineeid}}).then(udttr =>{
res.render('deptintranceexamresults',{user:req.user,trainee:trainee,config:config,success_msg:'Success! Updated To Be Registered'});

})
.catch(err =>{
console.log(err);
res.render('deptintranceexamresults',{user:req.user,trainee:trainee,config:config,error_msg:'Error While Updating Try Later!'});

})
}else{
res.render('deptintranceexamresults',{user:req.user,trainee:trainee,config:config,error_msg:'Error Cant Find Trainee'});

}
}).catch(err =>{
res.render('deptintranceexamresults',{error_msg:'Network Error Try Again',user:req.user,trainee:trainee,config:config});

})

})

router.post('/deptaddnewpracticalasschecklist', ensureAuthenticated, async function(req, res) {

const {mainchecklist,subchecklist,totalpoint,technicianpart,education} =req.body;
let errors =[];
const v1options = {
node: [0x01, 0x23],
clockseq: 0x1234,
msecs: new Date('2011-11-01').getTime(),
nsecs: 5678,
};
const config = await db.Config.findAll({});
aid = uuidv4(v1options);
console.log(req.body)
if(!mainchecklist||!education||!subchecklist||!totalpoint||!technicianpart ){
errors.push({msg:'Please Enter All Required Feild Value'})
}
if(technicianpart =="0" ){
errors.push({msg:'Please Select Technician Part'})
}

if(errors.length>0){

res.render('deptnewassessements',{user:req.user,errors,config:config});
}else{
const assessData ={
a_id: aid,

main_checklist:mainchecklist,
sub_checklist:JSON.parse(subchecklist),
total_point:totalpoint,
education:education,
technician_part:technicianpart,
is_active: 'Yes'
}
db.PracticalAssessment.findOne({where:{  education:education,
technician_part:technicianpart}}).then(pass =>{
if(pass){
db.PracticalAssessment.update({assessData},{where:{education:education,
technician_part:technicianpart}}).then(assess =>{
if(assess){
   res.render('deptnewassessements',{user:req.user,config:config,success_msg:'New Practical Assessment Create Successfully'});
}else{
   res.render('deptnewassessements',{user:req.user,config:config,error_msg:'Cant Add Practical Assessment'});
}
}).catch(err =>{
console.log(err)
res.render('deptnewassessements',{user:req.user,config:config,error_msg:'Cant Create Practical Assessment'});
})
}else{
db.PracticalAssessment.create(assessData).then(assess =>{
if(assess){
   res.render('deptnewassessements',{user:req.user,config:config,success_msg:'New Practical Assessment Create Successfully'});
}else{
   res.render('deptnewassessements',{user:req.user,config:config,error_msg:'Cant Add Practical Assessment'});
}
}).catch(err =>{
console.log(err)
res.render('deptnewassessements',{user:req.user,config:config,error_msg:'Cant Create Practical Assessment'});
})
}
}).catch(err =>{
console.log(err)
})



}

});
router.post('/updatepassword',ensureAuthenticated,async function(req,res){
   const {oldpassword,newpassword} = req.body;

})
router.post('/uploadquestions',ensureAuthenticated,upload.single('questionsFile'),async function(req,res){
   
   const config = await db.Config.findAll({});
   if(!req.file ){
      res.render('deptaddtrainerquestion',{user:req.user,config:config,error_msg:'Cant Upload Questions Try Again'});
   
   }else {
      const workbook = XLSX.readFile(req.file.path);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });


rows.shift(); // Remove header row
const questions = rows.map(row => {
const v1options = {
node: [0x01, 0x23],
clockseq: 0x1234,
msecs: new Date('2011-11-01').getTime(),
nsecs: 5678,
};

qid = uuidv4(v1options);
return {
q_id: qid,
question: row[1],
question_choiceA: row[2],
question_choiceB: row[3],
question_choiceC: row[4],
question_choiceD: row[5],
language_preference: row[6],
answer: row[7],
difficulty_level: row[8],
course_category: row[9],
education_category: row[10],
added_by: req.user.staffid,
is_active: row[12]
};
});

db.QuestionBankOne.bulkCreate(questions)
.then(() => {
res.render('deptaddnewquestion',{user:req.user,config:config,success_msg:'New Questions Uploaded To Question Bank Successfully'});

})
.catch(err => {
console.error(err);
res.render('deptaddnewquestion',{user:req.user,config:config,error_msg:'Cant Upload Questions Try Again'});

});} 
})
router.get('/deptdeletequestion/(:qid)',ensureAuthenticated,async function(req,res){

   db.QuestionBankOne.findOne({where:{q_id:req.params.qid}}).then(qstn =>{
      if(qstn){
         db.QuestionBankOne.destroy({where:{q_id:req.params.qid}}).then(() => {
           db.QuestionBankOne.findAll({}).then(question =>{
            res.render('deptallquestionlist',{user:req.user,question:question,success_msg:'Question Deleted From Question Bank Successfully'});
           }).catch(err => {
            res.render('deptallquestionlist',{user:req.user,question:question});
           }); 
         }).catch(err => {
            res.render('deptallquestionlist',{user:req.user,question:question});
         }); 
      }else{
         db.QuestionBankOne.findAll({}).then(question =>{
            res.render('deptallquestionlist',{user:req.user,question:question});
         }).catch(err => {
            res.render('deptallquestionlist',{user:req.user,question:question});
         }); 
      }
   }).catch(err => {
      res.render('deptallquestionlist',{user:req.user,question:question});
   }); 


});
router.get('/deptdeletequestiontot/(:qid)',ensureAuthenticated,async function(req,res){
  
   const config = await db.Config.findAll({where:{config_type:'Education'}})
  
   db.TrainerQuestionBank.findOne({where:{q_id:req.params.qid}}).then(qstn =>{
      if(qstn){
         db.TrainerQuestionBank.destroy({where:{q_id:req.params.qid}}).then(() => {
           db.TrainerQuestionBank.findAll({}).then(question =>{
            res.render('deptalltrainerquestionlist',{config:config,user:req.user,question:question,success_msg:'Question Deleted From Question Bank Successfully'});
         }).catch(err => {
            res.render('deptalltrainerquestionlist',{config:config,user:req.user,question:question});
         }); 
         }).catch(err => {
            res.render('deptalltrainerquestionlist',{config:config,user:req.user,question:question});
         }); 
      }else{
         db.TrainerQuestionBank.findAll({}).then(question =>{
            res.render('deptalltrainerquestionlist',{config:config,user:req.user,question:question});
         }).catch(err => {
            res.render('deptalltrainerquestionlist',{config:config,user:req.user,question:question});
         }); 
      }
   }).catch(err => {
      res.render('deptalltrainerquestionlist',{config:config,user:req.user,question:question});
   }); 

   
});
router.post('/uploadtrainerquestions',ensureAuthenticated,upload.single('questionsFile'),async function(req,res){

const {asstype,courseupload} = req.body;

const config = await db.Config.findAll({});
if(!req.file || !asstype || !courseupload){
   res.render('deptaddtrainerquestion',{asstype:asstype,user:req.user,config:config,error_msg:'Cant Upload Questions Try Again'});

}
else
{
const workbook = XLSX.readFile(req.file.path);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

rows.shift(); // Remove header row
const questions = rows.map(row => {
const v1options = {
node: [0x01, 0x23],
clockseq: 0x1234,
msecs: new Date('2011-11-01').getTime(),
nsecs: 5678,
};

qid = uuidv4(v1options);
return {
q_id: qid,
question: row[1],
choice_a: row[2],
choice_b: row[3],
choice_c: row[4],
choice_d: row[5],
language: row[6],
answer: row[7],
difficulty_level: row[8],
course: row[9],
education: courseupload,
added_by: req.user.staffid,
is_active: row[12],
assessment_type:asstype
};
});

db.TrainerQuestionBank.bulkCreate(questions)
.then(() => {
res.render('deptaddtrainerquestion',{asstype:asstype,user:req.user,config:config,success_msg:'New Questions Uploaded To Question Bank Successfully'});

})
.catch(err => {
console.error(err);
res.render('deptaddtrainerquestion',{asstype:asstype,user:req.user,config:config,error_msg:'Cant Upload Questions Try Again'});

}); }
})


router.get('/deptnewassessmenttrainer',ensureAuthenticated,async function(req,res){
const config = await db.Config.findAll({})
res.render('deptnewassessmenttrainer',{user:req.user,config:config})
})

router.post('/deptaddnewtrainerpracticalasschecklist', ensureAuthenticated, async function(req, res) {

const {mainchecklist,subchecklist,totalpoint,technicianpart,education} =req.body;
let errors =[];
const v1options = {
node: [0x01, 0x23],
clockseq: 0x1234,
msecs: new Date('2011-11-01').getTime(),
nsecs: 5678,
};
const config = await db.Config.findAll({});
aid = uuidv4(v1options);
console.log(req.body)
if(!mainchecklist||!education||!subchecklist||!totalpoint||!technicianpart ){
errors.push({msg:'Please Enter All Required Feild Value'})
}
if(technicianpart =="0" ){
errors.push({msg:'Please Select Technician Part'})
}

if(errors.length>0){

res.render('deptnewassessmenttrainer',{user:req.user,errors,config:config});
}else{
const assessData ={
a_id: aid,

main_checklist:mainchecklist,
sub_checklist:JSON.parse(subchecklist),
total_point:totalpoint,
education:education,
technician_part:technicianpart,
is_active: 'Yes'
}
db.PracticalAssessmentTrainer.findOne({where:{ main_checklist:mainchecklist}}).then(pass =>{
if(pass){
db.PracticalAssessmentTrainer.update({assessData},{where:{education:education,
   technician_part:technicianpart}}).then(assess =>{
   if(assess){
      res.render('deptnewassessmenttrainer',{user:req.user,config:config,success_msg:'New Practical Assessment Create Successfully'});
   }else{
      res.render('deptnewassessmenttrainer',{user:req.user,config:config,error_msg:'Cant Add Practical Assessment'});
   }
   }).catch(err =>{
   console.log(err)
   res.render('deptnewassessmenttrainer',{user:req.user,config:config,error_msg:'Cant Create Practical Assessment'});
   })
}else{
db.PracticalAssessmentTrainer.create(assessData).then(assess =>{
   if(assess){
      res.render('deptnewassessmenttrainer',{user:req.user,config:config,success_msg:'New Practical Assessment Create Successfully'});
   }else{
      res.render('deptnewassessmenttrainer',{user:req.user,config:config,error_msg:'Cant Add Practical Assessment'});
   }
   }).catch(err =>{
   console.log(err)
   res.render('deptnewassessmenttrainer',{user:req.user,config:config,error_msg:'Cant Create Practical Assessment'});
   })
}
}).catch(err =>{
console.log(err)
})

}

});

router.post('/deptaddnewtrainerquestion', ensureAuthenticated, async function(req, res) {

const {question,choicea,asstype,langpre,choiceb,choicec,choiced,answer,education,course,difficulty_level} =req.body;
let errors =[];
const v1options = {
node: [0x01, 0x23],
clockseq: 0x1234,
msecs: new Date('2011-11-01').getTime(),
nsecs: 5678,
};
const config = await db.Config.findAll({});
qid = uuidv4(v1options);
console.log(req.body)
if(!question || ! asstype||! langpre || !choicea || !choiceb || !choicec || !choiced || !answer || !education || !course ||!difficulty_level){
errors.push({msg:'Please Enter  All Required Feild Value'})
}
if(langpre =="0"){
errors.push({msg:'Please Select Language'})
}
var difficulty;
if(difficulty_level){
if(difficulty_level=="1"){
   difficulty ="Easy";
}else if(difficulty_level=="2"){
   difficulty ="Medium";
}else if(difficulty_level=="3"){
   difficulty ="Strong";

}
}
if(errors.length>0){

res.render('deptaddtrainerquestion',{asstype:asstype,user:req.user,errors,config:config});
}else{
   const questiondata ={
   q_id: qid,
question:question,

choice_a: choicea,
choice_b:choiceb,
choice_c:choicec,
choice_d:choiced,
answer: answer,
language:langpre,
difficulty_level:difficulty,
course: course,
education:education,
added_by: req.user.staffid,
is_active: 'Yes',
assessment_type:asstype,

   }
   db.TrainerQuestionBank.create(questiondata).then(configs =>{
   if(configs){
      res.render('deptaddtrainerquestion',{asstype:asstype,user:req.user,config:config,success_msg:'New Question Add To Bank Successfully'});
   }else{
      res.render('deptaddtrainerquestion',{asstype:asstype,user:req.user,config:config,error_msg:'Cant Add Question'});
   }
   }).catch(err =>{
   res.render('deptaddtrainerquestion',{asstype:asstype,user:req.user,config:config,error_msg:'Cant Create Question'});
   })


}

}); 
router.get('/deptalltraineetrainerlistmarklist', ensureAuthenticated, async function(req, res) {
const [trainee, metadata] = await db.sequelize.query(
`
SELECT TraineeTrainers.uniqueid, TraineeTrainers.fullname, trainee_code,gender,age, TraineeTrainers.licence_type, 
COALESCE(intrance.theory_result, 0) AS theory_result,
COALESCE(intrance.practical_result, 0) AS practical_result,
COALESCE(pmt1.score, 0) AS score1,
COALESCE(pmt2.score, 0) AS score2,
COALESCE(pmt3.score, 0) AS score3
FROM TraineeTrainers 
LEFT JOIN IntranceExamResults AS intrance ON TraineeTrainers.uniqueid = intrance.trainee_id
LEFT JOIN (
SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Training' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
FROM PracticalMarkTrainers
GROUP BY trainee_id
) AS pmt1 ON TraineeTrainers.uniqueid = pmt1.trainee_id
LEFT JOIN (
SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Examining' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
FROM PracticalMarkTrainers
GROUP BY trainee_id
) AS pmt2 ON TraineeTrainers.uniqueid = pmt2.trainee_id
LEFT JOIN (
SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Project' THEN PracticalMarkTrainers.score ELSE 0 END)
AS score
FROM PracticalMarkTrainers
GROUP BY trainee_id
) AS pmt3 ON TraineeTrainers.uniqueid = pmt3.trainee_id where is_registered='Yes';


`
   );
const config= await  db.Config.findAll();
res.render('deptalltraineetrainerlist',{user:req.user,trainee:trainee,config:config});

});
router.get('/deptalltraineetrainerlistcurrentstudentmarklist', ensureAuthenticated, async function(req, res) {
   const [trainee, metadata] = await db.sequelize.query(
   `
   SELECT TraineeTrainers.uniqueid,Batches.batch_name, TraineeTrainers.fullname, trainee_code,gender,age, TraineeTrainers.licence_type, 
   COALESCE(intrance.theory_result, 0) AS theory_result,
   COALESCE(intrance.practical_result, 0) AS practical_result,
   COALESCE(pmt1.score, 0) AS score1,
   COALESCE(pmt2.score, 0) AS score2,
   COALESCE(pmt3.score, 0) AS score3,
   COALESCE(pmt4.score, 0) AS score4
   FROM TraineeTrainers 
   inner join Batches on TraineeTrainers.batch_id = Batches.batch_id
   LEFT JOIN IntranceExamResults AS intrance ON TraineeTrainers.uniqueid = intrance.trainee_id
   LEFT JOIN (
   SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Training' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
   FROM PracticalMarkTrainers
   GROUP BY trainee_id
   ) AS pmt1 ON TraineeTrainers.uniqueid = pmt1.trainee_id
   LEFT JOIN (
   SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Examining' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
   FROM PracticalMarkTrainers
   GROUP BY trainee_id
   ) AS pmt2 ON TraineeTrainers.uniqueid = pmt2.trainee_id
   LEFT JOIN (
      SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Presentation' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
      FROM PracticalMarkTrainers
      GROUP BY trainee_id
      ) AS pmt4 ON TraineeTrainers.uniqueid = pmt4.trainee_id
   LEFT JOIN (
   SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Project' THEN PracticalMarkTrainers.score ELSE 0 END)
   AS score
   FROM PracticalMarkTrainers
   GROUP BY trainee_id
   ) AS pmt3 ON TraineeTrainers.uniqueid = pmt3.trainee_id where is_registered='Yes' and is_graduated IS NULL and Batches.is_current='Yes';
   
   
   
   `
      );
   const config= await  db.Config.findAll();
   res.render('deptalltraineetrainerlistcurrentstudentmarklist',{user:req.user,trainee:trainee,config:config});
   
   });
router.get('/deptalltehadsotraineelist', ensureAuthenticated, async function(req, res) {
const [trainee, metadata] = await db.sequelize.query(
`
SELECT Trainees.uniqueid AS trainee_id, Trainees.fullname, Trainees.age, Trainees.gender, Trainees.trainee_code,Trainees.licence_type, 
   theoretical.attempt_no_theory, theoretical.theoretical_score as tscore,
   practical.attempt_no, practical.score as pscore
FROM Trainees
LEFT JOIN (
   SELECT trainee_id, attempt_no_theory, theoretical_score,
      ROW_NUMBER() OVER (PARTITION BY trainee_id ORDER BY theoretical_score DESC) AS theory_rank
   FROM TheoreticalMarks
) AS theoretical
ON Trainees.uniqueid = theoretical.trainee_id AND theoretical.theory_rank = 1
LEFT JOIN (
SELECT trainee_id, testcode, MAX(attempt_no) AS attempt_no, SUM(score) AS score,
      ROW_NUMBER() OVER (PARTITION BY trainee_id ORDER BY SUM(score) DESC) AS practical_rank
FROM PracticalMarks
GROUP BY trainee_id, testcode
) AS practical
ON Trainees.uniqueid = practical.trainee_id AND practical.practical_rank = 1
where Trainees.pass_fail='FAIL' and is_active='Yes'
ORDER BY Trainees.uniqueid;

`
   );
const udttr = await db.Trainee.findAll({where:{is_active:'Yes',pass_fail:'FAIL'}})
const config= await  db.Config.findAll();
res.render('deptalltehadsotraineelist',{udttr:udttr,user:req.user,trainee:trainee,config:config});

});
router.get('/deptalltehadsotraineelistpass', ensureAuthenticated, async function(req, res) {
const [trainee, metadata] = await db.sequelize.query(
`
SELECT Trainees.uniqueid AS trainee_id, Trainees.fullname, Trainees.ref_no, Trainees.age, Trainees.gender, Trainees.trainee_code,Trainees.licence_type, 
theoretical.attempt_no_theory, theoretical.theoretical_score as tscore,
practical.attempt_no, practical.score as pscore
FROM Trainees
LEFT JOIN (
SELECT trainee_id, attempt_no_theory, theoretical_score,
   ROW_NUMBER() OVER (PARTITION BY trainee_id ORDER BY theoretical_score DESC) AS theory_rank
FROM TheoreticalMarks
) AS theoretical
ON Trainees.uniqueid = theoretical.trainee_id AND theoretical.theory_rank = 1
LEFT JOIN (
SELECT trainee_id, testcode, MAX(attempt_no) AS attempt_no, SUM(score) AS score,
   ROW_NUMBER() OVER (PARTITION BY trainee_id ORDER BY SUM(score) DESC) AS practical_rank
FROM PracticalMarks
GROUP BY trainee_id, testcode
) AS practical
ON Trainees.uniqueid = practical.trainee_id AND practical.practical_rank = 1
where Trainees.pass_fail='PASS' and Trainees.is_sentto_ash='No'
ORDER BY Trainees.uniqueid;

`
);

const config= await  db.Config.findAll();
res.render('deptalltehadsotraineelistpass',{user:req.user,trainee:trainee,config:config});

});
router.get('/deptalltehadsotraineelistsenttoash', ensureAuthenticated, async function(req, res) {
const [trainee, metadata] = await db.sequelize.query(
`
SELECT Trainees.uniqueid AS trainee_id, Trainees.fullname,Trainees.ref_no, Trainees.round, Trainees.age, Trainees.gender, Trainees.trainee_code,Trainees.licence_type, 
   theoretical.attempt_no_theory, theoretical.theoretical_score as tscore,
   practical.attempt_no, practical.score as pscore
FROM Trainees
LEFT JOIN (
   SELECT trainee_id, attempt_no_theory, theoretical_score,
      ROW_NUMBER() OVER (PARTITION BY trainee_id ORDER BY theoretical_score DESC) AS theory_rank
   FROM TheoreticalMarks
) AS theoretical
ON Trainees.uniqueid = theoretical.trainee_id AND theoretical.theory_rank = 1
LEFT JOIN (
SELECT trainee_id, testcode, MAX(attempt_no) AS attempt_no, SUM(score) AS score,
      ROW_NUMBER() OVER (PARTITION BY trainee_id ORDER BY SUM(score) DESC) AS practical_rank
FROM PracticalMarks
GROUP BY trainee_id, testcode
) AS practical
ON Trainees.uniqueid = practical.trainee_id AND practical.practical_rank = 1
where Trainees.pass_fail='PASS' and Trainees.is_sentto_ash='Yes'
ORDER BY Trainees.uniqueid;

`
   );
   
const config= await  db.Config.findAll();
res.render('deptalltehadsotraineelistsenttoash',{user:req.user,trainee:trainee,config:config});

});
router.post('/searchthehadsotraineebyexamdate', ensureAuthenticated, async function(req, res) {
const{startDate,endDate} = req.body;
const config= await  db.Config.findAll();

const [results,resultsmeta] = await  db.sequelize.query(`

SELECT Trainees.uniqueid AS trainee_id, Trainees.fullname, Trainees.age, Trainees.gender, Trainees.trainee_code,Trainees.licence_type, 
theoretical.attempt_no_theory, theoretical.theoretical_score as tscore,
practical.attempt_no,practical.createdAt as pcreateat,theoretical.createdAt as pcreateat, practical.score as pscore
FROM Trainees
LEFT JOIN (
SELECT trainee_id, attempt_no_theory, theoretical_score,createdAt,
ROW_NUMBER() OVER (PARTITION BY trainee_id ORDER BY theoretical_score DESC) AS theory_rank
FROM TheoreticalMarks
WHERE createdAt >= :startDate AND createdAt <= :endDate
) AS theoretical
ON Trainees.uniqueid = theoretical.trainee_id AND theoretical.theory_rank = 1
LEFT JOIN (
SELECT trainee_id, attempt_no, score,createdAt,
ROW_NUMBER() OVER (PARTITION BY trainee_id ORDER BY score DESC) AS practical_rank
FROM PracticalMarks
WHERE createdAt >= :startDate AND createdAt <= :endDate
) AS practical
ON Trainees.uniqueid = practical.trainee_id AND practical.practical_rank = 1
ORDER BY Trainees.uniqueid;
`, {

replacements: {
startDate: startDate,
endDate: endDate
}

})
const udttr = await db.Trainee.findAll({where:{is_active:'Yes',pass_fail:'FAIL'}})

res.render('deptalltehadsotraineelist',{udttr:udttr,user:req.user,trainee:results,config:config});

});

router.post('/showassessementhistory/(:traineecode)',ensureAuthenticated,async function(req,res){
const config= await  db.Config.findAll();

const trainee = await db.Trainee.findOne({where:{trainee_code:req.params.traineecode}})
if(trainee){
var traineeid = trainee.uniqueid;
const [tresults,tresmeta] = await  db.sequelize.query(`
select * from TheoreticalMarks where
TheoreticalMarks.trainee_id = :traineeid
`, {
replacements: {
   traineeid:traineeid
   }

})
const [presults,presmeta] = await  db.sequelize.query(`
select * from PracticalMarks inner join PracticalAssessments on 
PracticalAssessments.a_id = PracticalMarks.assessment_id inner join 
Staffs on PracticalMarks.assess_by = Staffs.staff_id where
PracticalMarks.trainee_id = :traineeid
`, {
replacements: {
   traineeid:traineeid
   }

})
res.render('deptsinglestudentassessmentreport',{trainee:trainee,user:req.user,presults:presults,tresult:tresults,config:config});


}

});

router.post('/updateassementpassfail/(:traineecode)',ensureAuthenticated,async function(req,res){
 
   const {theoryattempt,practicalattempt,ispassfail }= req.body;
   const [trainee, metadata] = await db.sequelize.query(
      `
      SELECT Trainees.uniqueid AS trainee_id, Trainees.fullname, Trainees.age, Trainees.gender, Trainees.trainee_code,Trainees.licence_type, 
         theoretical.attempt_no_theory, theoretical.theoretical_score as tscore,
         practical.attempt_no, practical.score as pscore
      FROM Trainees
      LEFT JOIN (
         SELECT trainee_id, attempt_no_theory, theoretical_score,
            ROW_NUMBER() OVER (PARTITION BY trainee_id ORDER BY theoretical_score DESC) AS theory_rank
         FROM TheoreticalMarks
      ) AS theoretical
      ON Trainees.uniqueid = theoretical.trainee_id AND theoretical.theory_rank = 1
      LEFT JOIN (
      SELECT trainee_id, testcode, MAX(attempt_no) AS attempt_no, SUM(score) AS score,
            ROW_NUMBER() OVER (PARTITION BY trainee_id ORDER BY SUM(score) DESC) AS practical_rank
      FROM PracticalMarks
      GROUP BY trainee_id, testcode
      ) AS practical
      ON Trainees.uniqueid = practical.trainee_id AND practical.practical_rank = 1
      where Trainees.pass_fail='FAIL' and Trainees.is_active='Yes' 
      ORDER BY Trainees.uniqueid;
      
      `
         );
      
        const config= await  db.Config.findAll();
    db.Trainee.findOne({where:{trainee_code:req.params.traineecode}}).then(traineenew =>{
      if(traineenew){
         db.Trainee.update({attempt_count:theoryattempt,attempt_count_prac:practicalattempt,pass_fail:ispassfail},
            {where:{trainee_code:req.params.traineecode}}).then(udttr =>{
               db.Trainee.findAll({where:{pass_fail:'FAIL',is_active:'Yes' }}).then(udttr =>{
                  res.render('deptalltehadsotraineelist',{udttr:udttr,success_msg:'Update Trainee Status Successfully',user:req.user,trainee:trainee,config:config});
   
               }).catch(err =>{
                  res.render('deptalltehadsotraineelist',{udttr:'',user:req.user,trainee:trainee,config:config});
   
               })
            
            }).catch(err =>{
               console.log(err)
               res.render('deptalltehadsotraineelist',{udttr:udttr,user:req.user,trainee:trainee,config:config});
   
            })
      }
    }).catch(err =>{
      console.log(err)
      res.render('deptalltehadsotraineelist',{udttr:udttr,user:req.user,trainee:trainee,config:config});
   
    })

});

router.post('/updatetotstatusgraduated/(:traineeid)',ensureAuthenticated,async function(req,res){
   const trainees = await  db.TraineeTrainer.findOne({where:{uniqueid:req.params.traineeid}})
   const batch = db.Batch.findAll({})
   const course = await db.TOTCourses.findAll({where:{licence_type:trainees.licence_type}})
   const theoreticalresult = await db.TOTTraineeMark.findOne({where:{trainee_id:req.params.traineeid}});
const [practicalresult, metadata] = await db.sequelize.query(
  `
  SELECT TraineeTrainers.uniqueid,Batches.batch_name, TraineeTrainers.fullname, trainee_code,gender,age, TraineeTrainers.licence_type, 
  COALESCE(intrance.theory_result, 0) AS theory_result,
  COALESCE(intrance.practical_result, 0) AS practical_result,
  COALESCE(pmt1.score, 0) AS score1,
  COALESCE(pmt2.score, 0) AS score2,
  COALESCE(pmt3.score, 0) AS score3,
  COALESCE(pmt4.score, 0) AS score4,
  COALESCE(pmt5.score, 0) AS score5,
  COALESCE(pmt7.score, 0) AS score7,
  COALESCE(pmt6.score, 0) AS score6
  FROM TraineeTrainers 
  inner join Batches on TraineeTrainers.batch_id = Batches.batch_id
  LEFT JOIN IntranceExamResults AS intrance ON TraineeTrainers.uniqueid = intrance.trainee_id
  LEFT JOIN (
  SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Training' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
  FROM PracticalMarkTrainers
  GROUP BY trainee_id
  ) AS pmt1 ON TraineeTrainers.uniqueid = pmt1.trainee_id
  LEFT JOIN (
  SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Examining' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
  FROM PracticalMarkTrainers
  GROUP BY trainee_id
  ) AS pmt2 ON TraineeTrainers.uniqueid = pmt2.trainee_id
  LEFT JOIN (
     SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Presentation' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
     FROM PracticalMarkTrainers
     GROUP BY trainee_id
     ) AS pmt4 ON TraineeTrainers.uniqueid = pmt4.trainee_id
     LEFT JOIN (
        SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Obstacle_Course_Preparation' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
        FROM PracticalMarkTrainers
        GROUP BY trainee_id
        ) AS pmt5 ON TraineeTrainers.uniqueid = pmt5.trainee_id
        LEFT JOIN (
           SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Vehicle_Examination' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
           FROM PracticalMarkTrainers
           GROUP BY trainee_id
           ) AS pmt6 ON TraineeTrainers.uniqueid = pmt6.trainee_id
           LEFT JOIN (
            SELECT trainee_id, SUM(CASE WHEN assessment_part = 'ExitExam' THEN PracticalMarkTrainers.score ELSE 0 END) AS score
            FROM PracticalMarkTrainers
            GROUP BY trainee_id
            ) AS pmt7 ON TraineeTrainers.uniqueid = pmt7.trainee_id
  LEFT JOIN (
  SELECT trainee_id, SUM(CASE WHEN assessment_part = 'Project' THEN PracticalMarkTrainers.score ELSE 0 END)
  AS score
  FROM PracticalMarkTrainers
  GROUP BY trainee_id
  ) AS pmt3 ON TraineeTrainers.uniqueid = pmt3.trainee_id where is_registered='Yes' and is_graduated IS NULL and Batches.is_current='Yes' and TraineeTrainers.uniqueid='${req.params.traineeid}';
  
  
  
  `
     );
const config= await  db.Config.findAll();

 db.TraineeTrainer.findOne({where:{uniqueid:req.params.traineeid}}).then((tottrainee)=>{
  if(tottrainee){
   db.TraineeTrainer.update({is_graduated:'Yes'},{where:{uniqueid:req.params.traineeid}}).then(()=>{
      res.render('depttotsinglestudentmarklist',{success_msg:'Update TOT Trainee Status Graduated Successfully!',theoreticalresult:theoreticalresult,config:config,course:course,practicalresult:practicalresult,batch:batch,user:req.user,trainees:trainees,config:config});

   }).catch(err =>{
      res.render('depttotsinglestudentmarklist',{theoreticalresult:theoreticalresult,config:config,course:course,practicalresult:practicalresult,batch:batch,user:req.user,trainees:trainees,config:config});

   })

  }else{
   res.render('depttotsinglestudentmarklist',{theoreticalresult:theoreticalresult,config:config,course:course,practicalresult:practicalresult,batch:batch,user:req.user,trainees:trainees,config:config});

  }

 }).catch(err =>{
   res.render('depttotsinglestudentmarklist',{theoreticalresult:theoreticalresult,config:config,course:course,practicalresult:practicalresult,batch:batch,user:req.user,trainees:trainees,config:config});

 })

});

router.get('/deptprintgraduatedtottraineelist', ensureAuthenticated, async function(req, res) {
   
   
   const batch= await  db.Batch.findAll({});

  const trainee= await db.TraineeTrainer.findAll({where:{is_graduated:'Yes'}});
const config= await  db.Config.findAll();
res.render('deptprintgraduatedtottraineelist',{batch:batch,user:req.user,trainee:trainee,config:config});

     
}); 
module.exports = router;