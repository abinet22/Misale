module.exports = (sequelize, DataTypes) => {

    const ActivationLog = sequelize.define("ActivationLog", {
     
  trainee_id: {
    type: DataTypes.STRING,
 
  },
  reciept_no: {
    type: DataTypes.STRING
  },
  activate_by: {
    type: DataTypes.STRING
  }
  
})
    return ActivationLog;
};


