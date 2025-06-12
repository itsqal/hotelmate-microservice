import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import dotenv from 'dotenv';
import { typeDefs } from './schema.js';
import { resolvers } from './graphql/resolvers.js';
import { pool } from './db/connection.js';
import { GraphQLClient } from 'graphql-request';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;
const HOST = '0.0.0.0';

// Create GraphQL clients for HotelEase services
const guestServiceClient = new GraphQLClient('http://guest_service:8000/graphql');
const roomServiceClient = new GraphQLClient('http://room_service:8000/graphql');
const reservationServiceClient = new GraphQLClient('http://reservation_service:8000/graphql');
const billingServiceClient = new GraphQLClient('http://billing_service:8000/graphql');

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

async function startServer() {
  await server.start();
  
  app.use(express.json());
  app.use('/graphql', expressMiddleware(server, {
    context: async () => ({
      db: pool,
      hotelEaseClient: {
        guest: guestServiceClient,
        room: roomServiceClient,
        reservation: reservationServiceClient,
        billing: billingServiceClient
      }
    })
  }));

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server ready at http://${HOST}:${PORT}/graphql`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
}); 