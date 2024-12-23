const injectScripts = (req, res, next) => {
  const originalRender = res.render;
  res.render = function (view, options, callback) {
    originalRender.call(this, view, options, (err, html) => {
      if (err) {
        if (typeof callback === 'function') {
          return callback(err);
        } else {
          return next(err);
        }
      }

      // Inject the script loader
      const scriptTag = '<script src="/js/scriptLoader.js"></script>';
      const modifiedHtml = html.replace('</body>', `${scriptTag}</body>`);

      if (typeof callback === 'function') {
        callback(null, modifiedHtml);
      } else {
        this.send(modifiedHtml);
      }
    });
  };
  next();
};

module.exports = injectScripts;