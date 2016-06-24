# JustGo

This application is meant to allow users to play the Go board game
with friends through networked-play or in hotseat mode 
(... or with an AI if the user has no friends.)

### Screenshots

![Screenshots](/doc/gameplay.png)

### Ongoing Project Notice
Note this project is far from complete and the files here are to demonstrate our 
planned architecture. Development is underway with the following in course deadlines: 

    June 26 -- Milestone 3 (Peer Review Designs)
    July 21 -- Milestone 4a (Implementation)
    July 28 -- Milestone 4b (Final Report) 

### Use

Two servers need to be run (one for application, one for course instructor's "AI")

### AI Server

1. You will need to clone the Go "AI" from the course instructor's github  
    
    https://github.com/sdiemert/goai

2. In the goai root directory modify the app.js file by adding the following line at the bottom:

    makeServer(false);

3. Navigate the project root directory and install dependencies required for the application
   using the node package manager.

    npm install <...>

4. Run the AI server in node

    node app.js

### Application Server

1. Navigate the project root directory and install dependencies required for the application
using the node package manager.

    npm install <...>

2. Run the server in node

    node server.js

3. On a web browser go to (127.0.0.1:30144) and click on board intersections (EXACTLY on the intersections :))

4. Wait for the app to break (we're currently tweaking our sattelites to make this step harder)



