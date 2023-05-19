module.exports = (sequelize, DataTypes) => {

    const IntranceExamResult = sequelize.define("IntranceExamResult", {
      trainee_id: {
        type: DataTypes.STRING,
     
      },
  practical_result: {
    type: DataTypes.DECIMAL,
 
  },

  theory_result: {
    type: DataTypes.DECIMAL
  },
  practical_count:{
    type: DataTypes.DECIMAL
  },
  theory_count:{
    type: DataTypes.DECIMAL
  }

})
    return IntranceExamResult;
};


