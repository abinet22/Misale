module.exports = (sequelize, DataTypes) => {

    const  TraineeTestCode= sequelize.define("TraineeTestCode", {
      trainee_id: {
        type: DataTypes.STRING,
     
      },
  appointment_date: {
    type: DataTypes.DATE,
 
  },

  test_code: {
    type: DataTypes.STRING
  }
})
    return TraineeTestCode;
};


