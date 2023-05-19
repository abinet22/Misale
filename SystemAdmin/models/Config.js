module.exports = (sequelize, DataTypes) => {

    const Config = sequelize.define("Config", {
      config_id: {
        type: DataTypes.STRING,
     
      },
  config_name: {
    type: DataTypes.STRING,
 
  },
 
  config_type: {
    type: DataTypes.STRING
  }
  
})
    return Config;
};


