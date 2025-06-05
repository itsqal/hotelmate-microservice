import { GraphQLClient, gql } from "graphql-request";
import dotenv from 'dotenv';

dotenv.config();

const guest_service_url = process.env.GUEST_SERVICE_URL;
const reservation_service_url = process.env.RESERVATION_SERVICE_URL;

const guestClient = new GraphQLClient(guest_service_url);
const reservationClient = new GraphQLClient(reservation_service_url);

export async function fetchGuestData() {
    const query = gql`
        query {
            guests {
                id
                fullName
                email
                phone
                address 
            }
        }
    `;


    return guestClient.request(query);
}

export async function fetchGuestById(guest_id) {
    const query = gql`
        query ($id: Int!) {
            guest(id: $id) {
                id
                fullName
                email
                phone
                address
            }
        }
    `;

    const variables = { id: guest_id };
    const data = await guestClient.request(query, variables);
    return data.guest;
}

export async function fetchReservationData() {
    const query = gql`
        query {
            reservations {
                id
                checkInDate
                checkOutDate
            }
        }
    `;

    return reservationClient.request(query);
}