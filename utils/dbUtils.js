const db = require('../config/firebase');

// Utility functions to interact with Firestore

// Fetch all seats
exports.getAllSeats = async () => {
  const seatsSnapshot = await db.collection('seats').orderBy('seatNumber').get();
  return seatsSnapshot.docs.map((doc) => doc.data());
};

// Update seat status
exports.updateSeats = async (seats) => {
  const batch = db.batch();
  seats.forEach((seat) => {
    const seatRef = db.collection('seats').doc(seat.seatNumber.toString());
    batch.update(seatRef, { isBooked: true });
  });
  await batch.commit();
};
