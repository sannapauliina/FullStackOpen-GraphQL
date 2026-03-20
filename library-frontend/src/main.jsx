import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
  split,
  gql,
} from "@apollo/client";

import { setContext } from "@apollo/client/link/context";
import { getMainDefinition } from "@apollo/client/utilities";

import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

// HTTP-linkki
const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
});

// Auth-headerit
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("library-user-token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// WebSocket-linkki (graphql-ws)
const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:4000/graphql",
  }),
);

// Split: subscriptionit → WS, muut → HTTP
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  authLink.concat(httpLink),
);

// Apollo Client
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

createRoot(document.getElementById("root")).render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
);
