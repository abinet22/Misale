module.exports = (sequelize, DataTypes) => {

    const PracticalAssessmentTrainer = sequelize.define("PracticalAssessmentTrainer", {
      a_id: {
        type: DataTypes.STRING,
     
      },
      main_checklist: {
        type: DataTypes.STRING
      },
      sub_checklist: {
        type: DataTypes.JSON
      },
      total_point: {
        type: DataTypes.DECIMAL
      },
  education: {
    type: DataTypes.STRING
  },
  technician_part:{
    type: DataTypes.STRING
  },
  is_active: {
    type: DataTypes.STRING
  }
  
})
    return PracticalAssessmentTrainer;
};


