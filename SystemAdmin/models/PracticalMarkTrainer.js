module.exports = (sequelize, DataTypes) => {

    const PracticalMarkTrainer = sequelize.define("PracticalMarkTrainer", {
      m_id: {
        type: DataTypes.STRING,
     
      },
      trainee_id: {
        type: DataTypes.STRING
      },
      assessment_part: {
        type: DataTypes.STRING
      },
      total_point: {
        type: DataTypes.DECIMAL
      },
      score: {
        type: DataTypes.DECIMAL(10,2)
      },
      testcode:{
        type: DataTypes.STRING
      },
  assessment_detail: {
    type: DataTypes.JSON
  },
  assess_by:{
    type: DataTypes.STRING
  },
  finish_time: {
    type: DataTypes.STRING
  },
  attempt_no: {
    type: DataTypes.STRING
  },
  education_id: {
    type: DataTypes.STRING
  },
  assessment_id:{
    type: DataTypes.STRING
  }

  
})
    return PracticalMarkTrainer;
};


