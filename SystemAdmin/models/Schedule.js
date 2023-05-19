module.exports = (sequelize, DataTypes) => {

    const Schedule = sequelize.define("Schedule", {
      staff_id: {
        type: DataTypes.STRING,
     
      },
  from_date: {
    type: DataTypes.DATE,
 
  },

  technical_part: {
    type: DataTypes.STRING
  },
  schedule_type:{
    type: DataTypes.STRING,
  },
  batch_id:{
    type: DataTypes.STRING
  }
})
    return Schedule;
};


