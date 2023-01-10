/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const { Admin , Election , Question , Option} = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("manaswini_s_online_voting_app_27", ["POST", "PUT", "DELETE"]));

const path = require("path");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");

const saltRounds = 10;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));
app.use(flash());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "my-super-secret-key-12345678920065",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, //24 hrs
    },
    resave: true,
    saveUninitialized: true,
  })
);
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());


passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      (username, password, done) => {
        Admin.findOne({ where: { email: username } })
          .then(async (user) => {
            const result = await bcrypt.compare(password, user.password);
            if (result) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Invalid password" });
            }
          })
          .catch(() => {
            return done(null, false, { message: "Invalid Email-ID or Password" });
          });
      }
    )
  );
  passport.serializeUser((user, done) => {
    console.log("Serializing user in session", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser((id, done) => {
    Admin.findByPk(id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        done(error, null);
      });
  });


  app.get("/signup", (request , response) => {
    response.render("adminsignup" , {
        title: "Sign Up",
        csrfToken: request.csrfToken(),
    });
  });

  app.post("/admins", async (request , response) => {
    //we are using hashedpw to encrypt
    if(!request.body.firstName) {
        request.flash("error" , "Please enter first name");
        return response.redirect("/signup");
    }
    if(!request.body.email) {
        request.flash("error","Please enter email");
        return response.redirect("/signup");
    }
    if(!request.body.password) {
        request.flash("error","please enter password");
        return response.redirect("/signup");
    }

    const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
    console.log(hashedPwd);
  try {
    const user = await Admin.createAdmin({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        response.redirect("/");
      } else {
        response.redirect("/elections");
      }
    });
  } catch (error) {
    console.log(error);
    request.flash("error", "email already registered");
    return response.redirect("/signup");
  }
});

app.get("/login", (request, response) => {
  if (request.user) {
    return response.redirect("/elections");
  }
  response.render("login", {
    title: "Sign in page",
    csrfToken: request.csrfToken(),
  });
});

app.get("/signout", (request, response, next) => {
    request.logout((err) => {
      if (err) {
        return next(err);
      }
      response.redirect("/");
    });
  });
  
  app.get("/", async (request, response) => {
    if (request.user) {
      return response.redirect("/elections");
    } else {
      response.render("index", {
        title: "Online Election Application",
        csrfToken: request.csrfToken(),
      });
    }
  });
  
  app.post(
    "/session",
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    ( request, response) => {
      response.redirect("/elections");
    }
  );

app.get("/elections" , connectEnsureLogin.ensureLoggedIn(),async (request , response) => {
        const loggedInAdmin = request.user.id;
        const userName = request.user.firstName + " " + request.user.lastName;
        try{
        const displayElections = await Election.getElections(loggedInAdmin);

        if(request.accepts("html")) {
            response.render("elections",{
                title: "Online Election Application",
                userName: userName,
                displayElections,
            });
        } else {
            return response.json({
                displayElections,
            });
        }
    } catch (error) {
        console.log(error);
        return response.status(422).json(error);
    }
});

app.get(
    "/elections/create",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      return response.render("createnew_election", {
        title: "Create new election",
        csrfToken: request.csrfToken(),
      });
    }
  );

app.post(
    "/elections",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      if (request.body.electionName.length < 5) {
        request.flash("error", "Election name should be atleast 5 characters");
        return response.redirect("/elections/create");
      }
      try {
        await Election.addNewElection({
          electionName: request.body.electionName,
          adminId: request.user.id,
        });
        return response.redirect("/elections");
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    }
  );
  
  app.get(
    "/elections/:id",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      try {
        const election = await Election.retrieveElection(request.params.id);
        const numberOfQuestions = await Question.countQuestions(
          request.params.id
        );
        return response.render("election_homepage", {
          id: request.params.id,
          title: election.electionName,
          noq: numberOfQuestions,
        });
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    }
  );


  app.get(
    "/elections/:id/questions",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      try {
        const election = await Election.retrieveElection(request.params.id);
        const questions = await Question.getQuestions(request.params.id);
        if (request.accepts("html")) {
          return response.render("display_questions", {
            title: election.electionName,
            id: request.params.id,
            questions: questions,
            csrfToken: request.csrfToken(),
          });
        } else {
          return response.json({
            questions,
          });
        }
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    }
  );

  app.get(
    "/elections/:id/questions/create",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      return response.render("createnew_ques", {
        id: request.params.id,
        csrfToken: request.csrfToken(),
      });
    }
  );

  app.post(
    "/elections/:id/questions/create",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      try {
        const question = await Question.addQuestion({
          questionName: request.body.questionName,
          description: request.body.description,
          electionId: request.params.id,
        });
        return response.redirect(
          `/elections/${request.params.id}/questions/${question.id}`
        );
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    }
  );




module.exports = app;