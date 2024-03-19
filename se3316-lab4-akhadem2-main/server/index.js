

//dependacies
const express = require('express')

const app = express()
const fs = require('fs');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const validator = require('validator');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');



//middle wear to allow localhost:3000 to make calls to the backend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    
    // Respond to preflight request
    if ('OPTIONS' == req.method) {
      res.sendStatus(200);
    } else {
      next();
    }  });


//database connection
const mysql = require('mysql');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '3316Lab4',
    database: 'Users'
});



//port
const port = process.env.PORT || 5000;







//passport and cookies
app.use(cookieParser());
app.use(session({ secret: 'yoursecret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());



//Policies funciton start
router.get('/policies', async (req, res) => {
  

  const sql = `
  SELECT * FROM Policies`; // gets all policies

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.status(200).json(result);
        }
    });
});

router.put('/policies/:name', async (req, res) => {
  const { name } = req.params;
  const { content } = req.body; //gets name 
  db.query('UPDATE Policies SET policy_content = ? WHERE policy_name = ?', [content, name], function(err, results) {// updates policy content where name
    if (err) {
        return res.status(500).json({ message: 'An error occurred.' });
    }
    return res.json({ message: 'User status updated successfully.' });
});
});

router.post('/dmca', async (req, res) => {
  const { ReviewID, Type } = req.body; // uses review ID and type and updates DMCA log
  db.query('INSERT INTO DMCA_Logs (ReviewID, Type) VALUES (?, ?)', [ReviewID, Type], function(err, results) {
    if (err) {
        return res.status(500).json({ message: 'An error occurred.' });
    }
    return res.json({ message: 'User status updated successfully.' });
});

});
router.get('/dmca/:id', async (req, res) => {
  const { id } = req.params; //gets selected dmca log by ID
  db.query('SELECT * FROM DMCA_Logs WHERE LogID = ?', [id], function(err, results) { //
      if (err) {
          return res.status(500).json({ message: 'An error occurred.' });
      }
      return res.json(results[0]);
  });
});

router.get('/dmca', async (req, res) => {
  db.query('SELECT * FROM DMCA_Logs', function(err, results) {
      if (err) { //gets all dmca logs for selector of log id in policies
          return res.status(500).json({ message: 'An error occurred.' });
      }
      return res.json(results);
  });
});

router.put('/dmca/:id', async (req, res) => {
  const { id } = req.params;
  const { ReviewID, DateNoticeSent, DateDisputeReceived, Notes, Status } = req.body;
  db.query('UPDATE DMCA_Logs SET ReviewID = ?, DateNoticeSent = ?, DateDisputeReceived = ?, Notes = ?, Status = ? WHERE LogID = ?', [ReviewID, DateNoticeSent, DateDisputeReceived, Notes, Status, id], function(err, results) {
      if (err) { //admin can update a DMCA log and almost all of the fields in it
          return res.status(500).json({ message: 'An error occurred.' });
      }else{
          return res.status(200).json({ message: 'DMCA log entry updated successfully.' });
      }
      
  });
});

//policies functions end







passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, //email and password for logging in
  function(email, password, done) {
    if (!validator.isEmail(email)) { //validate email
      return done(null, false, { message: 'Invalid email format.' });
    }

    db.query('SELECT * FROM systemusers WHERE email = ?', [email], function(err, results) { // searches table for user by email
      if (err) { return done(err); }
      if (results.length === 0) { return done(null, false, { message: 'Incorrect email.' }); } //if no results email doesnt exist
      //sends message if disabled
      if (results[0].isDisabled == 1) { return done(null, false, { message: 'Account is disabled. Please contact the administrator.' }); }
      //sends message if not verified
      if (results[0].isVerified != 1) { return done(null, false, { message: 'Account is not verified. Please verify your account.', status: 403 });  }

      const hash = results[0].password.toString();//hashes password
      bcrypt.compare(password, hash, function(err, response) {//compairs hashed to hashed in sql
        if (response === true) { return done(null, results[0]); }
        else { return done(null, false, { message: 'Incorrect password.' }); } // tells incorrect password if not right
      });
    });
  }
));
  
//  storing the user's email in the session.
passport.serializeUser(function(user, done) {
  done(null, user.email); // Storing the user's email in the session.
});

//  retrieving the user's data using the email stored in the session.
passport.deserializeUser(function(email, done) {
  // Querying the database to find the user with the given email.
  db.query('SELECT * FROM systemusers WHERE email = ?', [email], function(err, results) {
    // If there is an error or the user is not found, it will be handled here.
    // Otherwise, the user's data is returned.
    done(err, results[0]); // Returning the user's data.
  });
});






let superheroinfo; //info json
let superheropowers; //power json
let MainList = []; // main list carrying all favorite lists

fs.readFile('./server/superhero_info.json', 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    superheroinfo = JSON.parse(data); // Assign data to parts
}); //reads the json and puts the data in a variable

fs.readFile('./server/superhero_powers.json', 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    superheropowers = JSON.parse(data); // Assign data to parts
});//reads the json and puts the data in a variable



app.use('/',express.static('client'))


//middlewear
app.use((req,res,next)=>{
    console.log(`${req.method} request for ${req.url}`)
    next();
})

app.use(express.json());

//get list of superheros info
router.get('/',(req,res)=>{
    res.send(superheroinfo)
});


//Admin Functionality
router.put('/user/:email', function(req, res, next) {
  const email = req.params.email;
  const isDisabled = req.body.isDisabled;
//updates isdisabled attribute for a user in the admin funcitonality
  db.query('UPDATE SystemUsers SET isDisabled = ? WHERE email = ?', [isDisabled, email], function(err, results) {
      if (err) {
          return res.status(500).json({ message: 'An error occurred.' });
      }
      return res.json({ message: 'User status updated successfully.' });
  });
});

router.put('/review/:id', function(req, res, next) {
  const id = req.params.id;
  const hidden = req.body.hidden;
  //updating reviews to make them hidden or unhidden
  db.query('UPDATE Reviews SET hidden = ? WHERE ReviewID = ?', [hidden, id], function(err, results) {
      if (err) {
          return res.status(500).json({ message: 'An error occurred.' });
      }
      return res.json({ message: 'Review status updated successfully.' });
  });
});

router.get('/users', function(req, res, next) {
  //gets all the users in the sql table
  db.query('SELECT * FROM SystemUsers', function(err, results) {
      if (err) {
          return res.status(500).json({ message: 'An error occurred.' });
      }
      return res.json(results);
  });
});

router.get('/reviews', function(req, res, next) {
  //gets all reviews in the sql
  db.query('SELECT * FROM Reviews', function(err, results) {
      if (err) {
          return res.status(500).json({ message: 'An error occurred.' });
      }
      return res.json(results);
  });
});

router.put('/userAdmin/:email', function(req, res, next) {
  const email = req.params.email;
  const isAdmin = req.body.isAdmin;
  //Updates users to admin or admin to users, only admin can do this in frontend
  db.query('UPDATE SystemUsers SET isAdmin = ? WHERE email = ?', [isAdmin, email], function(err, results) {
    if (err) {
      return res.status(500).json({ message: 'An error occurred.' });
    }
    return res.json({ message: 'User admin status updated successfully.' });
  });
});






//Admin Functionality end




router.post('/register', (req, res) => {
    const { email, password, nickname } = req.body;

    if (!validator.isEmail(email)) {//input validation for the email
        return res.status(400).send('Invalid email format');
    }

    // Check if the email is already registered
    db.query('SELECT * FROM systemusers WHERE email = ?', [email], function(err, results) {
        if (err) throw err;
        if (results.length > 0) {// if it finds an email in the system registation isnt allowed
          return res.status(400).send('Email allready registered');
        } else {
            // Hash the password
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) throw err;

                // Generate a verification token
                const token = crypto.randomBytes(64).toString('hex');

                // Save the user in the database
                db.query('INSERT INTO systemusers SET ?', {email: email, password: hash, nickname: nickname, verificationToken: token}, (err, result) => {
                    if (err) throw err;

                    // Send a verification email
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'propcashjoe123@gmail.com',
                            pass: 'qjbn wfzb cqah hmai'
                        }
                    });
                    const mailOptions = {
                        from: 'propcashjoe123@gmail.com',
                        to: email,
                        subject: 'Please verify your email',
                        text: `Your verification token is: ${token}`
                      };
                    transporter.sendMail(mailOptions, function(err, info) {
                        if (err) throw err;
                        res.send('User registered. A verification email has been sent.');
                    });
                });
            });
        }
    });
});
router.post('/resendVerificationEmail', (req, res) => {//function to resend verification
  const { email } = req.body;

  // Check if the email is registered
  db.query('SELECT * FROM systemusers WHERE email = ?', [email], function(err, results) {
    if (err) throw err;
    if (results.length === 0) {
      return res.status(400).send('Email not registered');
    } else {
      // Generate a new verification token
      const token = crypto.randomBytes(64).toString('hex');

      // Update the user's verification token in the database
      db.query('UPDATE systemusers SET verificationToken = ? WHERE email = ?', [token, email], (err, result) => {
        if (err) throw err;

        // Send a verification email
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'propcashjoe123@gmail.com',
            pass: 'qjbn wfzb cqah hmai'
          }
        });
        const mailOptions = {
          from: 'propcashjoe123@gmail.com',
          to: email,
          subject: 'Please verify your email',
          text: `Your verification token is: ${token}`
        };
        transporter.sendMail(mailOptions, function(err, info) {
          if (err) throw err;
          res.send('A verification email has been sent.');
        });
      });
    }
  });
});


router.get('/verify-email', function(req, res) {
    const token = req.query.token;
    console.log(`Received token: ${token}`);  // Log the received token
    db.query('UPDATE systemusers SET isVerified = 1 WHERE verificationToken = ?', [token], function(err, results) {// uses token to find the right one to update
        if (err) {
            console.error(err);  // Log any errors
            throw err;
        }
        console.log(`Updated rows: ${results.affectedRows}`);  // Log the number of updated rows
        res.send('Email verified');//tell user emaial has been verified
    });
});

// User Login Route
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {// authenticates using when logging in
    if (err) { return next(err); }
    if (!user) { // sends error if not user in the table
      const status = info.status || 401;
      return res.status(status).json({ message: info.message }); 
      }
    req.logIn(user, function(err) {// loggs in succesfuuly if there is a user
      if (err) { return next(err); }
      return res.json({ message: 'User logged in' });// tells user they are logged in
    });
  })(req, res, next);
});


router.get('/user', function(req, res, next) {
    const email = req.query.email;
    //function to get user by email, this allows me get their nickname and other things for when creating lists
    db.query('SELECT * FROM systemusers WHERE email = ?', [email], function(err, results) {
      if (err) {
        return res.status(500).json({ message: 'An error occurred.' });
      }
  
      if (results.length > 0) {
        const user = results[0];// error handling
        return res.json(user);
      } else {
        return res.status(404).json({ message: 'User not found.' });// if user not found it tells the user
      }
    });
  });



  router.post('/update-password', (req, res) => {
    const { email, oldPassword, newPassword } = req.body;

    // Check the old password
    db.query('SELECT password FROM systemusers WHERE email = ?', [email], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.status(400).send('Email does not exist');
        }
        bcrypt.compare(oldPassword, results[0].password, (err, result) => {// compaires he hashed passwords
            if (err) throw err;
            if (result) {
                // Old password is correct, check if the new password is the same as the old one
                bcrypt.compare(newPassword, results[0].password, (err, isSame) => {// makes sure new password is not same as old
                    if (err) throw err;
                    if (isSame) {
                        return res.status(400).send('New password cannot be the same as the old password');// tells user if old is same as new
                    }
                    // Hash the new password
                    bcrypt.hash(newPassword, 10, (err, hash) => {
                        if (err) throw err;

                        // Update the password in the database
                        db.query('UPDATE systemusers SET password = ? WHERE email = ?', [hash, email], (err, result) => {
                            if (err) throw err;
                            res.send('Password updated');//tells user password updated successfully
                        });
                    });
                });
            } else {
                res.status(400).send('Old password is incorrect');// tells user they entered the wrong old password
            }
        });
    });
});


router.post('/list', (req, res) => { //adds a list name without anything inside the list
    // Get the list name from the request body
    const newsuperheroname = req.body.name; //gets name of list


    if(newsuperheroname && !MainList[newsuperheroname] &&newsuperheroname.length < 30){ // if the name exists and its not in the list add it to the list
        MainList[newsuperheroname] = []; // Initialize an empty list
        console.log(MainList[newsuperheroname])
        res.status(201).json({ message: 'List created successfully' });
    }
    else{ //if name is allready in list dont add it
        res.status(400).json({ error: 'List name allready taken or invalid' });
    }

});
router.put('/list/:name',(req,res)=>{ //add ids to list by its name
    const name = req.params.name; //gets the name of the list
    const newsuperID = req.body.superHeroID; //gets the ids that user is putting inside list
    function isOnlyNumbers(arr) {//function to check that ids are only numbers
        return arr.every(item => Number.isFinite(Number(item)));
    }
    if (name && MainList[name] !== undefined &&name.length < 30 && isOnlyNumbers(newsuperID)) { // if the favoirites list is in the list then replace it with ids
        MainList[name] = newsuperID; // Replace the list
        console.log(MainList[name]) //output the list
        res.status(200).json({ message: 'List updated successfully' });
    } else { //if list isnt in the list send error
        res.status(400).json({ error: 'List name doesnt exist or is invalid' });
    }
});
router.get('/list/:name',(req,res)=>{ //gets the ids of a list based off the name
    const name = req.params.name; //gets name of list
    const regex = /^[\p{L}\s-]+$/u;// allows letters of all languages

    if (name && MainList[name] !== undefined && name.length < 30&&regex.test(name)) { //if list exists then retrieve ids
        const superHeroID = MainList[name]; //gets list onto object
        console.log(MainList[name])

        res.status(200).json({ superHeroID }); //returns ids
    }
    else {
        res.status(400).json({ error: 'List name does not exist or is invalid' }); //send error if list doesnt exist
    }
});

router.get('/publicLists', (req, res) => {
    const sql = `
    SELECT HeroLists.*,
           LENGTH(HeroLists.superHeros) - LENGTH(REPLACE(HeroLists.superHeros, ',', '')) + 1 AS numberOfHeroes,
           COALESCE(AVG(Reviews.Rating), 0) AS AverageRating,
           COALESCE(GROUP_CONCAT(Reviews.Rating SEPARATOR ', '), 'No ratings yet') AS ratings,
           COALESCE(GROUP_CONCAT(Reviews.Comment SEPARATOR ', '), 'No reviews yet') AS comments
    FROM HeroLists
    LEFT JOIN Reviews ON HeroLists.name = Reviews.listName AND Reviews.hidden = FALSE
    WHERE HeroLists.visibility = 'public'
    GROUP BY HeroLists.name
    ORDER BY HeroLists.lastModified DESC
    LIMIT 10
`;//gets all he public lists along with the reviews and calculates the average rating to be used in the front end and also gets the number of superheros


    db.query(sql, (err, result) => {
        if (err) {// error handling
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.status(200).json(result);//passing of data to frontend
        }
    });
});

router.get('/userLists/:email', (req, res) => {
    const { email } = req.params;
  
    const sql = `
      SELECT *,
             LENGTH(superHeros) - LENGTH(REPLACE(superHeros, ',', '')) + 1 AS numberOfHeroes
      FROM HeroLists
      WHERE creatorEmail = ?
      ORDER BY lastModified DESC
      LIMIT 20
    `;//gets the lists by email so each user can view their lists
  
    db.query(sql, [email], (err, result) => {
      if (err) {//error handling
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(200).json(result);//sending data
      }
    });
  });


router.delete('/deleteList/:name', (req, res) => {
    const { name } = req.params;
  
    const sqlCheck = `
      SELECT * FROM HeroLists
      WHERE name = ?
    `;//checks if list exists
  
    db.query(sqlCheck, [name], (err, result) => {
      if (err) {
        console.error('Error querying data:', err);
        return res.status(500).json({ message: 'Internal server error' });
      } else if (result.length === 0) {
        return res.status(404).json({ message: 'List not found.' });//tell user if list is not found
      } else {
        const sqlDelete = `
          DELETE FROM HeroLists
          WHERE name = ?
        `;// if list is there than create sql to delete the list
  
        db.query(sqlDelete, [name], (err, result) => {
          if (err) {// run sql delete to delete the list
            console.error('Error deleting data:', err);
            return res.status(500).json({ message: 'Internal server error' });
          } else {
            return res.status(200).json({ message: 'List deleted successfully.' });// tell user it has successfully deleted
          }
        });
      }
    });
  });
  

router.put('/editList/:name', (req, res) => {
    const { description, superHeros, visibility } = req.body;
    const { name } = req.params;
  
    const sql = `
      UPDATE HeroLists
      SET description = ?, superHeros = ?, visibility = ?
      WHERE name = ?
    `;//sql for editing lists
  
    const values = [description, superHeros, visibility, name];//gets values that will be edited
  
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error updating data:', err);
        return res.status(500).json({ message: 'Internal server error' });//tells user error occcured
      } else {
        return res.status(200).json({ message: 'List updated successfully.' });//tells user the list updated
      }
    });
  });

router.post('/createList', (req, res) => {
    const { name, description, superHeros, creatorEmail, creatorNickname, visibility } = req.body;
  
    const sql = `
      INSERT INTO HeroLists (name, description, superHeros, creatorEmail, creatorNickname, visibility)
      VALUES (?, ?, ?, ?, ?, ?)
    `;//sql for creating a list
  
    const values = [name, description, superHeros, creatorEmail, creatorNickname, visibility];//gets values needed to create a list

    const superHeroIds = superHeros.split(',');

    // Validate superhero IDs
    for (let i = 0; i < superHeroIds.length; i++) {
      if (!superheroinfo[superHeroIds[i]]) {//validates all the ids and says which one caused a error
        return res.status(400).json({ message: `Superhero with ID ${superHeroIds[i]} does not exist.` });
      }//doesnt create a list if there is an invalid id
    }

    db.query('SELECT COUNT(*) AS listCount FROM HeroLists WHERE creatorEmail = ?', [creatorEmail], (err, results) => {
      if (err) {//checks how many list the user has created
        console.error('Error fetching data:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
  
      if (results[0].listCount >= 20) {//makes sure the user has created under 20 lists, if they have created 20, then dont let them create this new one
        return res.status(400).json({ message: 'You have reached the limit of 20 lists.' });
      }
  
      // If the user hasn't reached the limit, proceed with the rest of your code
      
    });
  
    db.query(sql, values, (err, result) => {
      if (err) {
        // If the error is due to a duplicate entry
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'List name already exists.' });
        }//makes sure that the list name doesnt allready exist and lets user know if it does
        // For other errors
        console.error('Error inserting data:', err);
        return res.status(500).json({ message: 'Internal server error' });
      } else {
        return res.status(200).json({ message: 'List created successfully.' });//tells user the list created succesfully
      }
    });
  });

  router.post('/addReview', (req, res) => {
    const { Rating, Comment, listName, userEmail } = req.body;
    const sql = `
        INSERT INTO Reviews (Rating, Comment, listName, userEmail)
        VALUES (?, ?, ?, ?)
    `;//adds a new review for a list to sql

    db.query(sql, [Rating, Comment, listName, userEmail], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            res.status(200).json({ message: 'Review added successfully!' });//tells user review added successfully
        }
    });
});

router.get('/superheroes/:ids', (req, res) => {
  // Extract ids from request parameters and convert them to integers
  const ids = req.params.ids.split(',').map(id => parseInt(id));
  
  // Filter the superheroes that match the provided ids
  const superheroes = superheroinfo.filter(data => ids.includes(data.id));
  
  // Map over the filtered superheroes to include their powers
  const superheroesWithPowers = superheroes.map(superhero => {
    // Find the superhero in the superheropowers array
    const powers = superheropowers.find(hero => hero.hero_names === superhero.name);
    
    // If the superhero has powers, add them to the superhero object
    if (powers) {
      return {
        ...superhero,
        // Filter the powers that are set to 'True'
        powers: Object.keys(powers).filter(power => powers[power] === 'True')
      };
    } else {
      // If the superhero doesn't have powers, return the superhero object as is
      return superhero;
    }
  });
  
  // Send the superheroes with their powers as a response
  res.send(superheroesWithPowers);
});
  

//hello
router.delete('/list/:name', (req, res) => {//deleting a list based off of a name
    const name = req.params.name; //gets name of list
    const regex = /^[\p{L}\s-]+$/u;// allows letters of all languages

    if (name && MainList[name] !== undefined && name.length < 30 && regex.test(name)) {
        delete MainList[name]; // Delete the list
        console.log(MainList[name]) //output list to make sure deleted
        res.status(200).json({ message: 'Superhero list deleted successfully' }); //send success message
    } else {
        res.status(400).json({ error: 'List name does not exist or is invalid' });//send error message
    }
});

router.get('/list/:name/information',(req,res)=>{//use the name and ids in a list to get the information of the heros in the list
    const name = req.params.name; //gets name of list
    const regex = /^[\p{L}\s-]+$/u;// allows letters of all languages

    if(!MainList[name]){ //if list doesnt exist then send error message
     res.status(400).json({error:'List cannot be found'})
    }else if (name.length < 30 && regex.test(name)){
        const IDs = MainList[name]; // if list does exist then get Ids

    const superheroinfoandpowers = superheroinfo.filter(superhero => IDs.includes(superhero.id)).map(hero => ({
        ...hero,
        powers: superheropowers.find(p => p.hero_names === hero.name),
    })); //uses ids to find the hero information and its powers
    res.status(200).json(superheroinfoandpowers) //sends this data on completion
    }

    
})
const levenshtein = require('js-levenshtein'); //soft matching


router.get('/search', (req, res) => {
  const { name, race, power, publisher } = req.query;//gets all search terms

  let foundmatches = superheroinfo;//if none are entered it returns all superheros
  if (name && name.length < 30) {//length less than 30 and name entered
    const regularMatches = foundmatches.filter(superhero => superhero.name.trim().toLowerCase().startsWith(name.trim().toLowerCase()));//removes whitespace and compares in lowercase
    const fuzzyMatches = foundmatches.filter(superhero => levenshtein(superhero.name.trim().toLowerCase(), name.trim().toLowerCase()) <= 2);//Soft matches to 2 missing characters
    foundmatches = [...new Set([...regularMatches, ...fuzzyMatches])];//returns regular matches and fuzzy matches
  }

  if (race && race.length < 30) {//length less than 30 and race entered
    const regularMatches = foundmatches.filter(superhero => superhero.Race.trim().toLowerCase().startsWith(race.trim().toLowerCase()));//removes whitespace and compares in lowercase
    const fuzzyMatches = foundmatches.filter(superhero => levenshtein(superhero.Race.trim().toLowerCase(), race.trim().toLowerCase()) <= 2);//Soft matches to 2 missing characters
    foundmatches = [...new Set([...regularMatches, ...fuzzyMatches])];//returns regular matches and fuzzy matches
  }

  if (power && power.length < 30) {//length less than 30 and power entered
    const heroesWithPower = superheropowers.filter(superhero => superhero[power] == 'True');//finds superheros where power = true
    const powerMatches = heroesWithPower.map(hero => superheroinfo.find(data => data.name === hero.hero_names)).filter(data => data !== undefined);//gets the hero info based on the heros with power
    foundmatches = foundmatches.filter(superhero => powerMatches.includes(superhero));//returns the found matches
  }

  if (publisher && publisher.length < 30) {//length less than 30 and publisher entered
    const regularMatches = foundmatches.filter(superhero => superhero.Publisher.trim().toLowerCase().startsWith(publisher.trim().toLowerCase()));//removes whitespace and compares in lowercase
    const fuzzyMatches = foundmatches.filter(superhero => levenshtein(superhero.Publisher.trim().toLowerCase(), publisher.trim().toLowerCase()) <= 2);//Soft matches to 2 missing characters
    foundmatches = [...new Set([...regularMatches, ...fuzzyMatches])];//returns regular matches and fuzzy matches
  }
  res.json(foundmatches);//returns matches 
});

router.get('/publishers',(req,res)=>{
    const publishers = [...new Set(superheroinfo.map(data => data.Publisher))]; // create a set to include the publishers in making it distinct values
    if (!publishers.length){ // if publishers is empty then they werent found so send error
        res.status(404).send(`Publishers was not found!`)
    } else {
        res.send(publishers); //if publishers exist then 
    }
});




router.get('/:superheroinfo_id',(req,res)=>{ //gets the superheroinformation for a superhero based off id
    const id = req.params.superheroinfo_id; //gets the desired id
    const superheroinfosingle = superheroinfo.find(data=>data.id === parseInt(id)); //finds id in json
    const regexnum = /^(800|[1-7][0-9]{0,2}|[0-9][0-9]{0,1})$/; // regex to only allow numbers

    if (superheroinfosingle&&id.length < 4&& regexnum.test(id)){ //if this id row exists
        res.send(superheroinfosingle) //send the id 
    }
    else{
        res.status(404).send(`Super hero ${id} was not found!`)// if row was not found then send error
    }
})

router.get('/:superheroinfo_id/powers',(req,res)=>{ //find the powers of superhero based off of id
    const id = req.params.superheroinfo_id;//get id 
    const regexnum = /^(800|[1-7][0-9]{0,2}|[0-9][0-9]{0,1})$/; // regex to only allow numbers

    if (id.length < 4 && regexnum.test(id)){
         const superhero = superheroinfo.find(data=>data.id === parseInt(id));//find superhero based off of id
    if (superhero == undefined){ // if super hero doesnt exist then send error
        res.status(404).send(`Super hero ${id} was not found!`)
        }
    const name = superhero.name; // get the name of the superhero 
    let powers = superheropowers.find(hero=> hero.hero_names == name);// use name to find in the powers json

    if(powers == undefined){ // if the name isnt in the json send an error
        res.status(404).send(`Super hero powers ${id} was not found!`)
    }

    res.send(powers) // send the powers of the superhero with the name
    }
    else{
        res.status(404).send(`Super hero powers not found as ID incorrect`)
    }
   
   
})








app.use('/api/superheroinfo',router) // router for simplicity

app.listen(port,()=>{
    console.log(`Listening on port ${port}`); // outputs the port its listening on into the console
});