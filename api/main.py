from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Init the FastAPI app, same idea as const app = express()
app = FastAPI(title='BlackHoleIO API')

# Setup for CORS so our front end React app can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins= ["http://localhost:5173"], # React app url
    allow_credentials=True, # Allow cookies/auth headers
    allow_methods= ["*"], # Allow all HTTP methods (GET, POST, etc.)
    allow_headers= ["*"], # Allow all headers
)


## For testing purposes ##/

# Basic GET route, similar to app.get('/')
@app.get('/')
def read_root():
    return {"message": "BlackHoleIO FastAPI Backend Running"}

# A sample endpoint for checking player stats
@app.get("/player/{player_id}")
def get_player(player_id: int):
    return {"player_id": player_id, "socre": 1000, "rank": 1}