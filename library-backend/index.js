require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const { typeDefs } = require("./schema");
const resolvers = require("./resolvers");
const User = require("./models/user");

const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");

const { makeExecutableSchema } = require("@graphql-tools/schema");
const {
  ApolloServerPluginLandingPageLocalDefault,
} = require("@apollo/server/plugin/landingPage/default");

const JWT_SECRET = "SUPER_SECRET_KEY";

mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("connected to MongoDB"))
  .catch((error) => console.log("error connection to MongoDB:", error.message));

// Schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Express-app
const app = express();
app.use(cors());
app.use(express.json());

// HTTP-server
const httpServer = createServer(app);

// WebSocket-server graphql-ws:lle
const wsServer = new WebSocketServer({
  noServer: true,
  handleProtocols: (protocols) => {
    if (protocols.includes("graphql-transport-ws")) {
      return "graphql-transport-ws";
    }
    return false;
  },
});

// Liitetään GraphQL schema WS-serveriin
useServer({ schema }, wsServer);

// Upgrade-handleri
httpServer.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/graphql")) {
    wsServer.handleUpgrade(req, socket, head, (ws) => {
      wsServer.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

// ApolloServer HTTP:lle
const server = new ApolloServer({
  schema,
  plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
});

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

  httpServer.listen(4000, () => {
    console.log("Server running at http://localhost:4000");
  });
})();
