const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const query = `
  query {
    me {
      username
      favoriteGenre
    }
  }
`;

fetch("http://localhost:4000/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im1hdHRpIiwiaWQiOiI2OWJhZTYwMTQxMThkZDVjM2JlYzAwOTciLCJpYXQiOjE3NzM4NTY5MzB9.wdvltDHxlNerr9wCbp4juxM8C1eaS8eXs8_610ZPTl8",
  },
  body: JSON.stringify({ query }),
})
  .then((res) => res.json())
  .then((data) => console.log(JSON.stringify(data, null, 2)))
  .catch((err) => console.error(err));
