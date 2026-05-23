// Placeholder for upcoming JWT authentication implementation

export const protect = (req, res, next) => {
  // Authentication check logic will be placed here
  next();
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Role authorization logic will be placed here
    next();
  };
};
