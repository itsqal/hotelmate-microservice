import { GraphQLClient } from 'graphql-request';

// HotelEase service URLs
const GUEST_SERVICE_URL = 'http://guest-service:8003/graphql';
const ROOM_SERVICE_URL = 'http://room-service:8001/graphql';
const RESERVATION_SERVICE_URL = 'http://reservation-service:8002/graphql';
const BILLING_SERVICE_URL = 'http://billing-service:8004/graphql';

// Create GraphQL clients
export const guestClient = new GraphQLClient(GUEST_SERVICE_URL);
export const roomClient = new GraphQLClient(ROOM_SERVICE_URL);
export const reservationClient = new GraphQLClient(RESERVATION_SERVICE_URL);
export const billingClient = new GraphQLClient(BILLING_SERVICE_URL);

// Guest Service Queries
export const getGuestByEmail = async (email) => {
  const query = `
    query GetGuestByEmail($email: String!) {
      guestByEmail(email: $email) {
        id
        fullName
        email
        phone
        address
      }
    }
  `;
  return guestClient.request(query, { email });
};

// Room Service Queries
export const getAvailableRooms = async () => {
  const query = `
    query GetAvailableRooms {
      availableRooms {
        id
        roomNumber
        roomType
        pricePerNight
        status
      }
    }
  `;
  return roomClient.request(query);
};

// Reservation Service Queries
export const getReservationsByGuest = async (guestId) => {
  const query = `
    query GetReservationsByGuest($guestId: Int!) {
      reservationsByGuest(guestId: $guestId) {
        id
        roomId
        checkInDate
        checkOutDate
        status
      }
    }
  `;
  return reservationClient.request(query, { guestId });
};

// Billing Service Queries
export const getBillsByReservation = async (reservationId) => {
  const query = `
    query GetBillsByReservation($reservationId: Int!) {
      billsByReservation(reservationId: $reservationId) {
        id
        totalAmount
        paymentStatus
        generatedAt
      }
    }
  `;
  return billingClient.request(query, { reservationId });
}; 