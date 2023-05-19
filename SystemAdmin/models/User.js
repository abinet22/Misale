module.exports = (sequelize, DataTypes) => {

    const User = sequelize.define("User", {
      staffid: {
        type: DataTypes.STRING,
     
      },
  fullname: {
    type: DataTypes.STRING,
 
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  photo: {
    type: DataTypes.BLOB("long"),
  },
  phone_number: {
    type: DataTypes.STRING,
  
   },
  username: {
    type: DataTypes.STRING
  },
  password: {
    type: DataTypes.STRING
  },
  user_roll: {
    type: DataTypes.STRING
  },
  is_active: {
    type: DataTypes.STRING
  }
  
})
    return User;
};


