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
                createdAt: { type: Date, default: Date.now },
                vote :[{userobjectid:{type:mongoose.Schema.Types.ObjectId, ref:"User"},value:{type:Number,enum:[1,-1,0]}}],
             })
            tweet = mongoose.model("tweet", tweetSchema)
         
            //comment schema
            const commentSchema = new mongoose.Schema(
            {
              commentContent:{type: String,},
              author: {type:mongoose.Schema.Types.ObjectId, ref :"User"},
              ParentPost:{type:mongoose.Schema.Types.ObjectId,ref:"tweet" },
              createdAt: {type: Date, default: Date.now },
            }
            )
            comment = mongoose.model("comment", commentSchema)

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
    res.send("user name is created "+ username)

   }
catch(err){ 

    console.error("error says: ",err)
    

   }
})
//checking before vote 
app.get("/get/vote/value", async(req,res)=>{
  console.log("route work");
 const postid=req.query.postid;

  const username  = req.cookies.username;
  if(!username){return res.status(401).send("not logined")}
     

     const user = await User.findOne({ username });   
     const post = await tweet.findById(postid);
     console.log(post.vote); // Is it an array? Are the objects structured correctly?
     
     const updatevote =  await tweet.findOne({_id:postid,"vote.userobjectid":user._id},
           )
           /* const updatevote = await tweet.findOne({
            _id: postid,
            vote: { $elemMatch: { userobjectid: user._id } }
          }); */
          

       if(!updatevote){
           res.json({value:"0"})  }  
          console.log("updatevote thing is ",updatevote);
    /*  let frontendvalue = updatevote.vote.value
     console.log("update.vote.value is logged as",updatevote.vote.value)
    
     res.json({value:1},) */
     const userVoteObj = updatevote.vote.find(v => v.userobjectid.toString() === user._id.toString());

     if (userVoteObj) {
        
     res.json(userVoteObj);
     } else {
       console.log("User hasn't voted yet");
       res.json({ value: 0 }); // or null, whatever you want for "no vote"
     }
     

})
//vote option
 app.post("/v1/vote", async (req,res)=>{

  const renderdvalue= req.query.value
  const postid=req.query.postid;
 // vote :[{userobjectid:{type:mongoose.Schema.Types.ObjectId, ref:"User"},
 // value:{type:Number,enum:[1,-1,0]}}],
          //all i need is userobj id and what postid it need to do the change 
          const username  = req.cookies.username;
          if(!username){return res.status(401).send("not logined")}
             console.log(req.body);  
// i hve username in username and im gonna use username to find the object id of user 
             const user = await User.findOne({ username });   

   const updatevote = await  tweet.findOneAndUpdate({_id:postid,"vote.userobjectid":user._id},
        {$set:{"vote.$.value":renderdvalue}}, {new:true}
      )
if(!updatevote){
  await tweet.findOneAndUpdate({_id:postid},{$addToSet :{vote:{userobjectid:user._id,value:renderdvalue}}})
}

res.redirect("/feed.html")
 })
app.get("/vote/count", async (req,res)=>{
  const postid = req.query.postid;
  if (!postid) return res.status(400).send("Post ID required");

  try {
    const post = await tweet.findById(postid);
    if (!post) return res.status(404).send("Post not found");

    const upvotes = post.vote.filter(v => v.value === 1).length;
    const downvotes = post.vote.filter(v => v.value === -1).length;
    const neutral = post.vote.filter(v => v.value === 0).length;
    const totalvote = upvotes - downvotes; // no need for eval
    console.log("upvote,downvote and their sum ",upvotes,downvotes,totalvote)
    res.json({
      upvotes,
      downvotes,
      neutral,
      totalvote
    });
  } catch (err) {
    console.error("Vote count error:", err);
    res.status(500).send("Internal Server Error");
  }
}
)


//post ap
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
 //commenting option 
 app.post("/comment", async (req, res) =>{
  console.log("user came here")
  const {commentContent,ParentPost} = req.body;
  const username  = req.cookies.username;
  
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).send("commenter not found");

    const newcomment = new comment({commentContent ,author: user._id,ParentPost})
    await newcomment.save();
    console.log("comment saved ");
//now we gonna send comment of similar tweet id 
res.redirect(`/posts.html?tweetId=${ParentPost}`)
  

   
  } catch (error) {
    console.log(error)
  } 


 })
 //sending comment back as per postid demands 
 app.get(`/post/comment/:parentpostid`,async(req,res)=>{
  

  const parentpostid = req.params.parentpostid;
console.log(`the parentpostid is ${parentpostid}`)
const comments = await comment
  .find({ ParentPost: parentpostid }) // 🔥 Only comments for this specific post
  .populate("author")
  .populate("ParentPost")
  .sort({ createdAt: -1 });

res.json(comments);

 
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
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Dashboard</title>
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            background-color: #f0f8ff;
            color: #2c3e50;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
          }
          h1 {
            margin-bottom: 20px;
          }
          form {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            margin: 10px 0;
            width: 90%;
            max-width: 400px;
          }
          input[type="text"] {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 8px;
            border: 1px solid #ccc;
          }
          button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
          }
          button:hover {
            background-color: #2980b9;
          }
          a {
            text-decoration: none;
            color: #3498db;
          }
        </style>
      </head>
      <body>
        <h1>Welcome, ${username}</h1>
        
        <form action="/v1/post" method="post">
          <input type="text" name="PostContent" id="posts" placeholder="Write your post here" />
          <button type="submit">Click to post</button>
        </form>  
  
        <form>
          <h4><a href="feed.html">Click here to go to feed page</a></h4>
        </form>
  
        <form action="/logout" method="POST">
          <button type="submit">Logout</button>
        </form>
      </body>
      </html>
    `);
 /*    res.send(`<h1>Welcome, ${username}</h1>
              
              <form action="/v1/post" method="post">
              <input type="text" name="PostContent" id="posts" placeholder="write your posts here">
            
              <button type="submit">Click to post</button>
          </form>  
          <h4><a href="feed.html">click here to goto feed page</a></h4>
          <form action="/logout" method="POST">
                
                <button type="submit">logout</button>
              </form>
          `);   */
  });
  
  app.post('/logout', (req, res) => {
    res.clearCookie('username');
    res.redirect("afterlogoutpage.html");
  });
  