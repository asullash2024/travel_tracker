import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Countries",
  password: "Uu@56569656",
  port: 5432,
});

// Connect to the database
db.connect()
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.error("Error connecting to the database", err);
  });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// GET home page
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT country_code FROM visited_countries");
    let countries = [];
    result.rows.forEach((country) => {
      countries.push(country.country_code);
    });
    console.log(result.rows);
    res.render("index.ejs", { countries: countries, total: countries.length });
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Close the database connection when the app is terminated
process.on("SIGINT", () => {
  db.end()
    .then(() => {
      console.log("Database connection closed");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Error closing database connection", err);
      process.exit(1);
    });
});