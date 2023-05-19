module.exports = (sequelize, DataTypes) => {

    const TheoreticalMark = sequelize.define("TheoreticalMark", {
      tm_id: {
        type: DataTypes.STRING,
     
      },
      trainee_id: {
        type: DataTypes.STRING
      },
      theoretical_score: {
        type: DataTypes.DECIMAL
      },
      attempt_no_theory: {
        type: DataTypes.DECIMAL
      },
      trainee_testcode: {
        type: DataTypes.STRING
      }
     
})
    return TheoreticalMark
};


