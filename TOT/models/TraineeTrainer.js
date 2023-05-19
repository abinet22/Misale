module.exports = (sequelize, DataTypes) => {

  const TraineeTrainer = sequelize.define("TraineeTrainer", {
    uniqueid: {
      type: DataTypes.STRING,
   
    },
fullname: {
  type: DataTypes.STRING,

},

phone_number: {
  type: DataTypes.STRING,

 },
 age: {
  type: DataTypes.STRING,

 },
 gender: {
  type: DataTypes.STRING,

 },
trainee_code: {
  type: DataTypes.STRING
},
password: {
  type: DataTypes.STRING
},
is_payed: {
  type: DataTypes.STRING
},

licence_type: {
  type: DataTypes.STRING
},
recept_no_intrance: {
  type: DataTypes.STRING
},
attempt_count: {
  type: DataTypes.DECIMAL
},
attempt_count_prac: {
  type: DataTypes.DECIMAL
},
is_active: {
  type: DataTypes.STRING
},
pass_fail: {
  type: DataTypes.STRING
},
recept_no_training: {
  type: DataTypes.STRING
},
recept_no_certificate: {
  type: DataTypes.STRING
},
is_selected: {
  type: DataTypes.STRING
},
is_take_second_certificate: {
  type: DataTypes.STRING
},
is_graduated: {
  type: DataTypes.STRING
},
is_registered: {
  type: DataTypes.STRING
},
batch_id: {
  type: DataTypes.STRING
},
tobe_registered: {
  type: DataTypes.STRING
},
last_exam_post_date:{
  type: DataTypes.DATE
}
})
  return TraineeTrainer;
};


