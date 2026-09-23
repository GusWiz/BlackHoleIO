first ran this "npm create vite@latest client -- --template react-ts", which create a react-ts template for the project. Then i cd "client", ran "npm install" to install all the dependencies. Then ran "npm run dev" to start the server.

Ran command: npm install express socket.io dotenv cors
npm install -D nodemon

1. A web framework for Node.js. It handles HTTP requests and creates the underlying server that Socket.IO hooks into.
2. socket.io: The core library for real-time, bidirectional communication between the server and players (broadcasting positions, player joins, mass updates, etc.).
3. cors: Enables Cross-Origin Resource Sharing. This lets your React app (running on port 5173) talk to your Node.js server (running on port 3000) without the browser blocking it.
4. dotenv: Loads configuration settings (like server ports) from a .env file.
5. nodemon (-D for dev dependency): Automatically restarts your server whenever you save changes to your server code so you don't have to restart it manually.