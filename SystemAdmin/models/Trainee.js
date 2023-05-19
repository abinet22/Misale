module.exports = (sequelize, DataTypes) => {

    const Trainee = sequelize.define("Trainee", {
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
  school_from: {
    type: DataTypes.STRING
  },
  licence_type: {
    type: DataTypes.STRING
  },
  recept_no: {
    type: DataTypes.STRING
  },
  attempt_count: {
    type: DataTypes.DECIMAL
  },
  is_active: {
    type: DataTypes.STRING
  },
  pass_fail: {
    type: DataTypes.STRING
  },
  attempt_count_prac: {
    type: DataTypes.DECIMAL
  },
  is_sentto_ash: {
    type: DataTypes.STRING
  },
  ref_no: {
    type: DataTypes.STRING
  },
  round: {
    type: DataTypes.STRING
  },
  last_exam_post_date:{
    type: DataTypes.DATE
  }
  
})
    return Trainee;
};


