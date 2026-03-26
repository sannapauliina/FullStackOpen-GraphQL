import React, { useState, useEffect } from "react";
import { useApolloClient, useQuery, useSubscription } from "@apollo/client";

import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import Recommendations from "./components/Recommendations";
import LoginForm from "./components/LoginForm";

import { ME, BOOK_ADDED, ALL_BOOKS } from "./queries";

const App = () => {
  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(null);
  const client = useApolloClient();
  const meResult = useQuery(ME);

  useSubscription(BOOK_ADDED, {
    onData: ({ client, data }) => {
      const payload = data?.data;
      if (!payload || !payload.bookAdded) return;

      const addedBook = payload.bookAdded;

      window.alert(`New book added: ${addedBook.title}`);

      // ALL_BOOKS -kyselyn välimuistin päivitys
      client.cache.updateQuery(
        { query: ALL_BOOKS, variables: { genre: null } },
        (old) => {
          if (!old) return { allBooks: [addedBook] };

          // Duplikaattien esto
          if (old.allBooks.some((b) => b.id === addedBook.id)) {
            return old;
          }

          return {
            allBooks: [...old.allBooks, addedBook],
          };
        },
      );
    },
  });

  useEffect(() => {
    const savedToken = localStorage.getItem("library-user-token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const logout = () => {
    setToken(null);
    localStorage.removeItem("library-user-token");
    client.clearStore();
    setPage("authors");
  };

  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>

        {token ? (
          <>
            <button onClick={() => setPage("add")}>add book</button>
            <button onClick={() => setPage("recommendations")}>
              recommendations
            </button>
            <button onClick={logout}>logout</button>
          </>
        ) : (
          <button onClick={() => setPage("login")}>login</button>
        )}
      </div>

      <Authors show={page === "authors"} />
      <Books show={page === "books"} />
      <NewBook show={page === "add"} />
      <Recommendations show={page === "recommendations"} />
      <LoginForm show={page === "login"} setToken={setToken} />
    </div>
  );
};

export default App;
