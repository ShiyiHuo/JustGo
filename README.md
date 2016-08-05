# JustGo

This application is meant to allow users to play the Go board game
with friends through networked-play or in hotseat mode 
(... or with an AI if the user has no friends.)
Implemented using NodeJS, ExpressJS, and MongoDB.

### Use

The server must be run on the engineering network to access the roberts.seng.uvic.ca "AI" server running on port 30000. 
Note the application was tested in Chrome/Safari. Other browsers have not been tested for compatibility.

1. Navigate the project root directory and install dependencies required for the application using the node package manager.

    npm install 

2. Run server.js in the latest version of node. This can be done using "n" on the roberts server.

    node server.js

3. On a web browser connected to the engineering network go to (roberts.seng.uvic.ca:30144) 

4. Enjoy!