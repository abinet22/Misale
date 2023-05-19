module.exports = (sequelize, DataTypes) => {

    const PracticalAssessment = sequelize.define("PracticalAssessment", {
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
    return PracticalAssessment;
};


