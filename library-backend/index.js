require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const User = require("./models/user");

const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const playground = require("graphql-playground-middleware-express").default;

const JWT_SECRET = "SUPER_SECRET_KEY";

mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("connected to MongoDB"))
  .catch((error) => console.log("error connection to MongoDB:", error.message));

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const app = express();
app.use(cors());
app.use(express.json());

(async () => {
  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req.headers.authorization || null;

        if (auth && auth.toLowerCase().startsWith("bearer ")) {
          const token = auth.substring(7);
          const decodedToken = jwt.verify(token, JWT_SECRET);
          const currentUser = await User.findById(decodedToken.id);
          return { currentUser };
        }

        return {};
      },
    }),
  );

  // GraphQL Playground
  app.get("/", playground({ endpoint: "/graphql" }));

  // HTTP server Expressin ympärille
  const httpServer = createServer(app);

  // WebSocket-palvelin subscriptioneille
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  // GraphQL WS -serveri
  useServer({ schema: server.schema }, wsServer);

  httpServer.listen(4000, () => {
    console.log("Server running at http://localhost:4000");
  });
})();
