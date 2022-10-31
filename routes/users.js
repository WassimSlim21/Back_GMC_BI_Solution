var express = require("express");
var router = express.Router();
const passport = require('passport');

var userCtrl = require("../controllers/user");
var auth = require("../middlewares/auth");
const multer = require('../middlewares/multer-config');
router.get("/", userCtrl.getUsers);
router.get("/:id", auth, userCtrl.getUserId);
// router.post("/signup", userCtrl.addUser);
router.post("/signup",multer.single('file'), userCtrl.addUserWithProfilePicture);
router.put("/:id", auth, userCtrl.updateUserId);
router.delete("/:id", userCtrl.deleteUserId);
router.post("/login", userCtrl.login);
router.post("/token", userCtrl.token);
router.post("/verify/account", auth, userCtrl.requestVerify);
router.get("/verify/account", userCtrl.verifyUser);
router.post("/reset/password", userCtrl.forgetPass);
router.put("/reset/password", userCtrl.resetPass);


// router.get('/', function (req, res) {
//     res.render('pages/index.ejs'); // load the index.ejs file
//   });
  
//   router.get('/profile', isLoggedIn, function (req, res) {
//     res.render('pages/profile.ejs', {
//       user: req.user // get the user out of session and pass to template
//     });
//   });
  
//   router.get('/error', isLoggedIn, function (req, res) {
//     res.render('pages/error.ejs');
//   });
  
//   router.get('/auth/facebook', passport.authenticate('facebook', {
//     scope: ['public_profile', 'email']
//   }));
  
//   router.get('/auth/facebook/callback',
//     passport.authenticate('facebook', {
//       successRedirect: '/profile',
//       failureRedirect: '/error'
//     }));
  
//   router.get('/logout', function (req, res) {
//     req.logout();
//     res.redirect('/');
//   });
  
//   function isLoggedIn(req, res, next) {
//     if (req.isAuthenticated())
//       return next();
//     res.redirect('/');
//   }



module.exports = router;
