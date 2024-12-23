// utils/generateReservationCode.js
const crypto = require('crypto');

async function generateUniqueReservationCode(Reservation) {
  let code;
  let exists = true;

  while (exists) {
    code = 'RES-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    exists = await Reservation.exists({ reservationCode: code });
  }

  return code;
}

module.exports = generateUniqueReservationCode;
