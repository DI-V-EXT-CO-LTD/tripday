exports.getTerms = async (req, res) => {
    try {
      
      res.render('term_condition');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };
  exports.getPrivacy = async (req, res) => {
    try {
      
      res.render('privacy_policy');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };
  exports.getServiceGurantee = async (req, res) => {
    try {
      
      res.render('service-guarantee');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  }
  exports.getMoreServiceInfo = async (req, res) => {
    try {
      
      res.render('moreServiceInfo');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  }
  exports.getCancelRefundPolicy = async (req, res) => {
    try {
      
      res.render('cancel_refundPolicy.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };