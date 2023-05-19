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
    type: DataTypes.STRING
  },
  is_active: {
    type: DataTypes.STRING
  },
  last_exam_post_date:{
    type: DataTypes.DATE
  }
  
})
    return Trainee;
};


