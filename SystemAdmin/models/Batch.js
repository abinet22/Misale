module.exports = (sequelize, DataTypes) => {

    const Batch = sequelize.define("Batch", {
     
  batch_id: {
    type: DataTypes.STRING,
 
  },
  batch_name: {
    type: DataTypes.STRING
  },
  is_current:{
    type: DataTypes.STRING
  }
 
  
})
    return Batch;
};


