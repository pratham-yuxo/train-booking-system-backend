const db = require('../config/firebase');

// Fetch all seats
exports.getSeats = async (req, res) => {
  try {
    const seatsSnapshot = await db.collection('seats').orderBy('seatNumber').get();
    const seats = seatsSnapshot.docs.map((doc) => doc.data());
    res.json(seats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching seats' });
  }
};

// Book seats
exports.bookSeats = async (req, res) => {
  const { numberOfSeats } = req.body;

console.log(numberOfSeats)
  if (!numberOfSeats || numberOfSeats < 1 || numberOfSeats > 7) {
    return res.status(400).json({ error: 'Invalid number of seats requested' });
  }

  try {
    const bookedSeats = await bookSeatsLogic(numberOfSeats);
    if (bookedSeats.length > 0) {
      res.json({ message: 'Seats booked successfully', seats: bookedSeats });
    } else {
      res.status(400).json({ error: 'Unable to book seats as requested.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error booking seats' });
  }
};


async function bookSeatsLogic(numberOfSeats) {
  const seatsRef = db.collection('seats');
  console.log("running");

  try {
    // Step 1: Fetch all seats and group by row
    const seatsSnapshot = await seatsRef.orderBy('seatNumber').get();
    const seats = seatsSnapshot.docs.map(doc => {
      return {
        seatNumber: doc.data().seatNumber,
        rowNumber: getRowNumber(doc.data().seatNumber), // Ensure getRowNumber is correct
        isBooked: doc.data().isBooked,
        seatDocRef: doc.ref
      };
    });

    console.log("Fetched seats:", seats.length);

    // Group seats by row for efficient row-wise booking
    const rows = {};
    seats.forEach(seat => {
      if (!rows[seat.rowNumber]) {
        rows[seat.rowNumber] = [];
      }
      rows[seat.rowNumber].push(seat);
    });

    // Step 2: Try to find a row with enough contiguous available seats
    const bookedSeats = [];

    for (const row of Object.values(rows)) {
      const availableSeatsInRow = row.filter(seat => !seat.isBooked);
      
      // Try to book in one row if possible
      if (availableSeatsInRow.length >= numberOfSeats) {
        const seatsToBook = availableSeatsInRow.slice(0, numberOfSeats);
        seatsToBook.forEach(seat => {
          bookedSeats.push(seat);
        });
        break; // Exit loop if we found all required seats in one row
      }
    }

    // Step 3: If not enough seats in one row, book nearby seats
    if (bookedSeats.length < numberOfSeats) {
      for (const row of Object.values(rows)) {
        const availableSeatsInRow = row.filter(seat => !seat.isBooked);
        
        for (const seat of availableSeatsInRow) {
          if (bookedSeats.length < numberOfSeats) {
            bookedSeats.push(seat);
          } else {
            break;
          }
        }

        if (bookedSeats.length === numberOfSeats) {
          break; // Exit loop if we've booked enough seats
        }
      }
    }

    console.log("Booking seats:", bookedSeats);

    // Step 4: Update the Firestore database to mark these seats as booked
    const batch = db.batch();
    bookedSeats.forEach(seat => {
      batch.update(seat.seatDocRef, { isBooked: true });
    });

    await batch.commit();

    console.log("Successfully booked seats:", bookedSeats.map(seat => seat.seatNumber));

    // Return the booked seat numbers
    return bookedSeats.map(seat => seat.seatNumber);

  } catch (error) {
    console.error("Error in booking logic:", error);
    throw error;
  }
}
function getRowNumber(seatNumber) {
  if (seatNumber <= 77) {
    return Math.ceil(seatNumber / 7); // For seats 1-77 (11 rows with 7 seats each)
  } else {
    return 12; // Seats 78-80 belong to the 12th row
  }
}