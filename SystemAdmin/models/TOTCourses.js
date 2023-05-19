module.exports = (sequelize, DataTypes) => {

    const TOTCourses = sequelize.define("TOTCourses", {
      c_id: {
        type: DataTypes.STRING,
     
      },
      course_code: {
        type: DataTypes.STRING
      },
      licence_type: {
        type: DataTypes.STRING
      },
      course_weight: {
        type: DataTypes.DECIMAL(10,2)
      },
  course_name: {
    type: DataTypes.STRING
  },
  course_type:{
    type: DataTypes.STRING
  },
  course_part:{
    type: DataTypes.STRING
  },
  
})
    return TOTCourses;
};


