const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Function to populate seats
const populateSeats = async () => {
  const batch = db.batch();  // Use batch to write multiple documents

  // Loop to create seat data for 80 seats (7 seats per row, last row has 3 seats)
  let seatNumber = 1;
  for (let row = 1; row <= 11; row++) {
    for (let seat = 1; seat <= 7; seat++) {
      const seatDocRef = db.collection('seats').doc(seatNumber.toString());
      batch.set(seatDocRef, {
        seatNumber: seatNumber,
        isBooked: false,  // Set all seats as available initially
      });
      seatNumber++;
    }
  }

  // Last row with 3 seats
  for (let seat = 1; seat <= 3; seat++) {
    const seatDocRef = db.collection('seats').doc(seatNumber.toString());
    batch.set(seatDocRef, {
      seatNumber: seatNumber,
      isBooked: false,  // Set all seats as available initially
    });
    seatNumber++;
  }

  // Commit the batch
  await batch.commit();
  console.log('Seats added to Firestore successfully');
};

// Call the function
populateSeats().catch((error) => {
  console.error('Error populating seats:', error);
});
