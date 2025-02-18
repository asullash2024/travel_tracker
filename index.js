import express from "express";
import pg from "pg";

const app = express();
const port = 3000;

// Database configuration
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Countries",
  password: "Uu@56569656",
  port: 5432,
});

let countries = []; // Array to store fetched countries

// Connect to the database and fetch data
db.connect()
  .then(async () => {
    console.log("Connected to the database");

    // Fetch countries from the database
    const result = await db.query(
      "SELECT id, country_code FROM visited_countries"
    ); // Adjust the query as needed
    countries = result.rows;
    console.log("Fetched countries:", countries);
  })
  .catch((err) => {
    console.error("Error connecting to the database", err);
    process.exit(1); // Exit the process if the database connection fails
  });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Home route
app.get("/", (req, res) => {
  res.render("index.ejs", {
    countries: JSON.stringify(countries), // Pass the entire countries array
    total: countries.length, // Pass the total number of countries
  });
});

app.post("/add", async (req, res) => {
  try {
    const country = req.body.country.trim();
    console.log("Received country:", country);

    // Fetch country_code from database
    const result2 = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'",
      [country.toLowerCase()]
    );

    let new_Country_code = result2.rows[0]?.country_code;

    // ✅ If country_code is not found, return an error
    if (!new_Country_code) {
      console.error(`Country code not found for: ${country}`);
      return res.status(404).send(`Error: No country code found for '${country}'`);
    }

    // ✅ Check if the country_code is already in visited_countries
    const checkResult = await db.query(
      "SELECT 1 FROM visited_countries WHERE country_code = $1",
      [new_Country_code]
    );

    if (checkResult.rows.length > 0) {
      console.warn(`Country '${country}' (code: ${new_Country_code}) is already visited.`);
      return res.status(409).send(`Error: '${country}' is already in visited countries.`);
    }

    // Insert new country_code into visited_Countries
    await db.query(
      "INSERT INTO visited_Countries (country_code) VALUES ($1)",
      [new_Country_code]
    );

    // Fetch updated list of visited countries
    const updatedResult = await db.query("SELECT id, country_code FROM visited_countries");
    countries = updatedResult.rows;

    res.render("index.ejs", {
      countries : JSON.stringify(countries),
      total: countries.length,
    });

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
});



// Handle server shutdown
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
