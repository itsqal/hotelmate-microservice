import dotenv from 'dotenv';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import { typeDefs } from './schema.js';
import { resolvers } from './resolver.js';

dotenv.config();

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

const init = async () => {
    const server = new ApolloServer({
        typeDefs,
        resolvers
    });

    await server.start();

    app.get('/', (req, res) => {
        res.send('Welcome to Review Service. This service is now up and running!');
    });

    app.use('/graphql', expressMiddleware(server));

    app.listen(port, '0.0.0.0', () => {
        console.log(`Server is running on port ${port}`);
    });
}

init()