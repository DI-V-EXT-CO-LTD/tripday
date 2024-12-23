module.exports = {
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/auth/login');
  },
  ensureVerified: function(req, res, next) {
    if (req.isAuthenticated() && req.user.isVerified) {
      return next();
    }
    if (!req.user.isVerified) {
      req.flash('error_msg', 'Please verify your account to access this resource');
    }
    res.redirect('/');
  }
};