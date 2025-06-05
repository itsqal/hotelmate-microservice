import express from "express";
import fetch from "node-fetch";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT;

app.get("/", async (req, res) => {
  try {
      res.render("home");
  } catch (error) {
      res.status(500).send("Error rendering landing page");
  }
});

app.get("/reviews", async (req, res) => {
  const query = `
    query {
      reviews {
        reviewId
        overallRating
        content
        guest {
          id
          fullName
        }
        aspects {
          aspectId
          rating
          comment
          aspect {
            name
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const { data } = await response.json();
    res.render("reviews", { reviews: data.reviews });
  } catch (error) {
    res.status(500).send("Error fetching reviews");
  }
});

app.listen(PORT, () => {
  console.log(`Frontend running on http://localhost:${PORT}`);
});