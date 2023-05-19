module.exports = (sequelize, DataTypes) => {

    const QuestionBankOne = sequelize.define("QuestionBankOne", {
      q_id: {
        type: DataTypes.STRING,
     
      },
  question: {
    type: DataTypes.TEXT("long"),
 
  },
 
  question_choiceA: {
    type: DataTypes.STRING,
  
   },
   question_choiceB: {
    type: DataTypes.STRING,
  
   },
   question_choiceC: {
    type: DataTypes.STRING,
  
   },
   question_choiceD: {
    type: DataTypes.STRING,
  
   },
   language_preference: {
    type: DataTypes.STRING,
  
   },
  answer: {
    type: DataTypes.STRING
  },
  difficulty_level: {
    type: DataTypes.STRING
  },
  course_category: {
    type: DataTypes.STRING
  },
  education_category: {
    type: DataTypes.STRING
  },
  added_by: {
    type: DataTypes.STRING
  },
  is_active: {
    type: DataTypes.STRING
  }
  
})
    return QuestionBankOne;
};


