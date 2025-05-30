import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import dotenv from 'dotenv';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import { pool } from './db/connection.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({
    db: pool
  })
});

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
}); 