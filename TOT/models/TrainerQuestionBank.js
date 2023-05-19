module.exports = (sequelize, DataTypes) => {

    const TrainerQuestionBank = sequelize.define("TrainerQuestionBank", {
      q_id: {
        type: DataTypes.STRING,
     
      },
      question: {
        type: DataTypes.STRING
      },
      choice_a: {
        type: DataTypes.STRING
      },
      choice_b: {
        type: DataTypes.STRING
      },
      choice_c: {
        type: DataTypes.STRING
      },
      choice_d: {
        type: DataTypes.STRING
      },
      answer: {
        type: DataTypes.STRING
      },
      education: {
        type: DataTypes.STRING
      },
      course:{
        type: DataTypes.STRING
      },
      difficulty_level:{
        type: DataTypes.STRING
      },
      assessment_type:{
        type: DataTypes.STRING
      },
      language:{
        type: DataTypes.STRING
      },
      is_active: {
        type: DataTypes.STRING
      }
  
})
    return TrainerQuestionBank;
};


