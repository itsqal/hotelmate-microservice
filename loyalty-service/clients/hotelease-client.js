import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';

dotenv.config();

// Create GraphQL clients for HotelEase services
const guestClient = new GraphQLClient(process.env.GUEST_SERVICE_URL);
const reservationClient = new GraphQLClient(process.env.RESERVATION_SERVICE_URL);

// Guest Service Queries
export const guestQueries = {
    getGuest: async (guestId) => {
        const query = `
            query GetGuest($guestId: Int!) {
                guest(id: $guestId) {
                    id
                    fullName
                    email
                    phone
                    address
                }
            }
        `;
        try {
            const data = await guestClient.request(query, { guestId: parseInt(guestId) });
            return data.guest;
        } catch (error) {
            console.error('Error fetching guest:', error);
            throw new Error('Failed to fetch guest details from Guest Service');
        }
    }
};

// Reservation Service Queries
export const reservationQueries = {
    getReservation: async (reservationId) => {
        const query = `
            query GetReservation($reservationId: Int!) {
                reservation(id: $reservationId) {
                    id
                    guestId
                    roomId
                    checkInDate
                    checkOutDate
                    status
                    guest {
                        id
                        fullName
                        email
                    }
                    room {
                        id
                        roomNumber
                        roomType
                        pricePerNight
                    }
                }
            }
        `;
        try {
            const data = await reservationClient.request(query, { reservationId: parseInt(reservationId) });
            return data.reservation;
        } catch (error) {
            console.error('Error fetching reservation:', error);
            throw new Error('Failed to fetch reservation details from Reservation Service');
        }
    },

    getReservationsByGuest: async (guestId) => {
        const query = `
            query GetReservationsByGuest($guestId: Int!) {
                reservationsByGuest(guestId: $guestId) {
                    id
                    roomId
                    checkInDate
                    checkOutDate
                    status
                    room {
                        pricePerNight
                    }
                }
            }
        `;
        try {
            const data = await reservationClient.request(query, { guestId: parseInt(guestId) });
            return data.reservationsByGuest;
        } catch (error) {
            console.error('Error fetching guest reservations:', error);
            throw new Error('Failed to fetch guest reservations from Reservation Service');
        }
    }
};

// Helper function to calculate points based on stay
export const calculatePoints = (reservation) => {
    const checkIn = new Date(reservation.checkInDate);
    const checkOut = new Date(reservation.checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const basePoints = nights * reservation.room.pricePerNight;
    
    // Additional points based on room type
    const roomTypeMultiplier = {
        'Standard': 1,
        'Deluxe': 1.2,
        'Suite': 1.5,
        'Presidential': 2
    }[reservation.room.roomType] || 1;

    return Math.round(basePoints * roomTypeMultiplier);
}; 