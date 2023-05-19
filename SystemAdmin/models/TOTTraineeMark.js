module.exports = (sequelize, DataTypes) => {

    const TOTTraineeMark = sequelize.define("TOTTraineeMark", {
      m_id: {
        type: DataTypes.STRING,
     
      },
      batch_id: {
        type: DataTypes.STRING,
     
      },
      trainee_id: {
        type: DataTypes.STRING
      },
      licence_type: {
        type: DataTypes.STRING
      },
      continues_one: {
        type: DataTypes.DECIMAL
      },
      continues_two: {
        type: DataTypes.DECIMAL
      },
      continues_three:{
        type: DataTypes.DECIMAL
      },
      continues_four:{
        type: DataTypes.DECIMAL
      },
      final_one:{
        type: DataTypes.DECIMAL
      },
      final_two:{
        type: DataTypes.DECIMAL
      },
      final_three:{
        type: DataTypes.DECIMAL
      },
      final_four:{
        type: DataTypes.DECIMAL
      },
      practical_one:{
        type: DataTypes.DECIMAL
      },
      practical_two:{
        type: DataTypes.DECIMAL
      },
      practical_three:{
        type: DataTypes.DECIMAL
      },
      project:{
        type: DataTypes.DECIMAL
      },

})
    return TOTTraineeMark;
};


