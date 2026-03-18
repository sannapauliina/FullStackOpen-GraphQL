const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const query = `
  mutation {
    createUser(
      username: "matti",
      favoriteGenre: "fantasy",
      password: "salasana"
    ) {
      username
      favoriteGenre
    }
  }
`;

fetch("http://localhost:4000/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query }),
})
  .then((res) => res.json())
  .then((data) => console.log(JSON.stringify(data, null, 2)))
  .catch((err) => console.error(err));
