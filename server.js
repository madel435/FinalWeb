const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const nodeCron = require("node-cron");
const { Op } = require("sequelize");
const sequelize = require("./utils/sequelize");
const TodoList = require("./models/Username");
const TodoListItems = require("./models/UsernameNew");

const port = 3210;

// ── DB Associations ───────────────────────────────────────────────
TodoList.hasMany(TodoListItems, { foreignKey: "userId" });
TodoListItems.belongsTo(TodoList, { foreignKey: "userId" });

// ── Middleware ────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "secret123",
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "pug");
app.set("views", __dirname);

app.use(express.static(path.join(__dirname, "public")));

// ── Auth middleware ───────────────────────────────────────────────
function requireLogin(req, res, next) {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/Quiz2/login?redirect=" + encodeURIComponent(req.originalUrl));
  }
}

// ── Routes ────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.render("views/home", {
    loggedIn: !!req.session.loggedIn,
    username: req.session.username || null,
  });
});

// ── Quiz 1 ────────────────────────────────────────────────────────
app.get("/Quiz1/quiz1", (req, res) => {
  res.redirect("/Quiz1/quiz1Q");
});

app.get("/Quiz1/quiz1Q", (req, res) => {
  res.render("Quiz1/quiz1Q", { loggedIn: !!req.session.loggedIn });
});

app.get("/Quiz1/results", (req, res) => {
  res.render("Quiz1/results", {
    loggedIn: !!req.session.loggedIn,
    username: req.session.username || null,
  });
});

app.post("/Quiz1/save", requireLogin, async (req, res) => {
  const { score, total, wrongTopics } = req.body;
  try {
    await TodoList.update(
      { quiz1score: parseInt(score), quiz1total: parseInt(total) },
      { where: { id: req.session.userId } }
    );
    if (wrongTopics && wrongTopics.length) {
      const topics = Array.isArray(wrongTopics) ? wrongTopics : [wrongTopics];
      for (const topic of topics) {
        await TodoListItems.findOrCreate({
          where: { userId: req.session.userId, task: "Study: " + topic },
          defaults: { userId: req.session.userId, task: "Study: " + topic, completed: false },
        });
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save score" });
  }
});

// ── Quiz 2 ────────────────────────────────────────────────────────
app.get("/Quiz2/login", (req, res) => {
  const redirect = req.query.redirect || null;
  res.render("Quiz2/login", { redirect });
});

app.post("/Quiz2/login", async (req, res) => {
  const { username, password, redirect } = req.body;
  try {
    const user = await TodoList.findOne({ where: { username, password } });
    if (user) {
      req.session.loggedIn = true;
      req.session.userId = user.id;
      req.session.username = user.username;
      const dest = redirect || "/Quiz2/quiz2Q";
      res.redirect(dest);
    } else {
      res.render("Quiz2/login", { error: "Invalid username or password.", redirect });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get("/Quiz2/quiz2Q", requireLogin, (req, res) => {
  res.render("Quiz2/quiz2Q");
});

app.get("/Quiz2/results", requireLogin, (req, res) => {
  res.render("Quiz2/results", { username: req.session.username });
});

app.post("/Quiz2/submit", requireLogin, async (req, res) => {
  const { score, ratings } = req.body;
  console.log("Submit hit - userId:", req.session.userId, "score:", score, "ratings:", ratings);
  try {
    await TodoList.update(
      { score: parseInt(score), quiz2ratings: JSON.stringify(ratings) },
      { where: { id: req.session.userId } }
    );
    if (ratings) {
      const ratingArr = Array.isArray(ratings) ? ratings : Object.values(ratings);
      const topics = [
        "Tracking weekly spending", "Checking funds before buying", "Setting aside savings",
        "Delaying gratification", "Understanding bank accounts", "Debit vs credit knowledge",
        "Understanding interest", "How people earn money", "Comparing prices", "Resisting ads",
        "Needs vs wants thinking", "Digital payment confidence", "Online payment safety",
        "Financial literacy value", "Financial decision control"
      ];
      for (let i = 0; i < ratingArr.length; i++) {
        if (parseInt(ratingArr[i]) <= 2) {
          await TodoListItems.findOrCreate({
            where: { userId: req.session.userId, task: "Improve: " + (topics[i] || "Area " + (i + 1)) },
            defaults: { userId: req.session.userId, task: "Improve: " + (topics[i] || "Area " + (i + 1)), completed: false },
          });
        }
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save score" });
  }
});

// ── Checklist ─────────────────────────────────────────────────────
app.get("/checklist", requireLogin, async (req, res) => {
  try {
    const items = await TodoListItems.findAll({ where: { userId: req.session.userId } });
    res.render("views/checklist", { items, username: req.session.username });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.post("/checklist/toggle", requireLogin, async (req, res) => {
  const { id } = req.body;
  try {
    const item = await TodoListItems.findOne({ where: { id, userId: req.session.userId } });
    if (item) {
      await item.update({
        completed: !item.completed,
        lastCompletedAt: !item.completed ? new Date() : null,
      });
      res.json({ success: true, completed: !item.completed });
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Could not update" });
  }
});

// ── Register ──────────────────────────────────────────────────────
app.get("/register", (req, res) => {
  res.render("views/register");
});

app.post("/register", async (req, res) => {
  const { username, password, email, name } = req.body;
  try {
    await TodoList.create({ username, password, email, name });
    res.redirect("/Quiz2/login");
  } catch (err) {
    console.error(err);
    res.render("views/register", { error: "Username already taken or invalid input." });
  }
});

// ── Feedback ──────────────────────────────────────────────────────
app.get("/feedback", (req, res) => {
  res.render("views/feedback", {
    loggedIn: !!req.session.loggedIn,
    username: req.session.username || null,
  });
});

app.post("/feedback", (req, res) => {
  const { name, message, rating } = req.body;
  console.log("Feedback received:", { name, message, rating });
  res.render("views/feedback", {
    loggedIn: !!req.session.loggedIn,
    username: req.session.username || null,
    success: true,
  });
});

// ── Other pages ───────────────────────────────────────────────────
app.get("/resourcepage", (req, res) => res.render("views/resourcepage"));
app.get("/FAdvisor",     (req, res) => res.render("views/FAdvisor"));

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// ── Cron ──────────────────────────────────────────────────────────
nodeCron.schedule("0 0 * * *", async () => {
  const users = await TodoList.findAll({ where: { email: { [Op.ne]: null } } });
  users.forEach(u => console.log(`Would send reminder to ${u.email}`));
});

// ── DB sync + start ───────────────────────────────────────────────
sequelize
  .sync({ dialectOptions: { connectTimeout: 5000 } })
  .then(() => {
    console.log("DB synced");
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
  })
  .catch(err => {
    console.error("❌ DB connection failed:", err.message);
    console.log("⚠️  Starting server WITHOUT database (DB features won't work)");
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
  });
