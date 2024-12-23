// middleware/authMiddleware.js
module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ success: false, message: 'Authentication required' });
  },
  forwardAuthenticated: (req, res, next) => {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  },
  isAdmin: (req, res, next) => {
    if (req.isAuthenticated() && (req.user.role === 'Admin' || req.user.role === 'SuperAdmin')) {
      return next();
    }
    res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
};