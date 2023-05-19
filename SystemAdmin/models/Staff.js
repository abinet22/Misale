module.exports = (sequelize, DataTypes) => {

    const Staff = sequelize.define("Staff", {
     
  staff_id: {
    type: DataTypes.STRING,
 
  },
  full_name: {
    type: DataTypes.STRING
  },
  phone_no: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.STRING
  },
  is_active: {
    type: DataTypes.STRING
  }
  
})
    return Staff;
};


