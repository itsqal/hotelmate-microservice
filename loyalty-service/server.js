import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import dotenv from 'dotenv';
import { typeDefs } from './schema.js';
import { resolvers } from './resolver.js';
import { pool } from './db/connection.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

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

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server ready at http://${HOST}:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
}); 