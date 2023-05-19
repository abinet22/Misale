module.exports = (sequelize, DataTypes) => {

    const Appointment = sequelize.define("Appointment", {
      trainee_id: {
        type: DataTypes.STRING,
     
      },
  appointment_date: {
    type: DataTypes.DATE,
 
  },

  appointment_tag: {
    type: DataTypes.STRING
  },
  appointment_for:{
    type: DataTypes.STRING
  }
})
    return Appointment;
};


