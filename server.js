const express = require("express");
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
/* const User = require("./module/user") */
 /* tweet = require("./module/tweet") */

 const cookieParser = require('cookie-parser');
 app.use(cookieParser());
 

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static('./public'))

/* mongoose.connect("mongodb://localhost:27017/socialDB",)
.then(()=>{console.log('connected to mongodb ')})
.catch(err =>{console.log('mongo db conection error',err)}); */

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));


            //fuking tweets schema 

            const tweetSchema = new mongoose.Schema({
                PostContent :{type: String, },
                author:{type:mongoose.Schema.Types.ObjectId, ref:"User" },
                createdAt: { type: Date, default: Date.now }
             })
            tweet = mongoose.model("tweet", tweetSchema)
         
//user schema 

const userSchema = new mongoose.Schema({
    username:{type: String , required: true   },
   
})
User= mongoose.model("User", userSchema)
///usewr ki bkc
app.post("/v1/userlist",async (req,res)=>{

    console.log("form submitted 🔥")
console.log(req.body);

const {username} =  req.body;

    //const existing =  userlist.find();
    const existing = await User.findOne({ username });
    if (existing) {
      console.log('Username already taken');
      return res.status(400).send("username already existing")
    }

 
 
 if(!username || username.trim()==="" ){
    return res.status(400).send("username missing")
    
};
 
 console.log("✅ Received user:",username );



try{


    const newUser = new User({username});
   await  newUser.save();
    console.log(newUser,"new user saved");
    res.send("user name is requested "+ username)

   }
catch(err){ 

    console.error("error says: ",err)
    

   }
})
//post api 

app.post("/v1/post",async (req,res)=>{
    const { PostContent} = req.body;
    const username  = req.cookies.username;
 if(!username){return res.status(401).send("not logined")}
    console.log(req.body);
    
   
    


   

    try{
        const user = await User.findOne({ username });
        if (!user) return res.status(404).send("User not found");

        const newtweet = new tweet({ PostContent,author: user._id });
                                
        console.log(newtweet,"new uposter yet to saved");
       await newtweet.save();
        console.log(newtweet,"new uposter saved");
        res.redirect("/feed.html")
    
       }
    catch(err){ 
    
        console.error("error for post says: ",err)
        
    
       }


})


app.listen(port,()=>{
    console.log("listening on :",port)
})

//feed section

app.get("/feed", async (req, res) => {
    try {
      const posts = await tweet.find().populate("author").sort({ createdAt: -1 });
      res.json(posts);
    } catch (err) {
      res.status(500).send("Error fetching feed");
      console.log(err)
    }
  });
  

  //login page landig page 
  app.post('/login', async (req, res) => {
  const { username } = req.body;
    console.log("user tryig to login")
  const user = await User.findOne({ username });
  if (!user) return res.status(404).send('User not found');

  // For now, just store the username in a cookie
  res.cookie('username', username);
 
  res.redirect("/dashboard")
});


//dashboard 
app.get('/dashboard', (req, res) => {
    const username = req.cookies.username;
    if (!username) return res.redirect('/login'); // fallback if user isn't logged in
  
    res.send(`<h1>Welcome, ${username}</h1>
              
              <form action="/v1/post" method="post">
              <input type="text" name="PostContent" id="posts" placeholder="write your posts here">
            
              <button type="submit">Click to post</button>
          </form>  
          <h4><a href="feed.html">click here to goto feed page</a></h4>
          <form action="/logout" method="POST">
                
                <button type="submit">logout</button>
              </form>
          `);  
  });
  
  app.post('/logout', (req, res) => {
    res.clearCookie('username');
    res.redirect("afterlogoutpage.html");
  });
  