# Deployment Guide for AI Network Threat Detection

This text acts as a quick guide to deploying your application on the web. The application consists of two parts: the **Frontend** (HTML/CSS/JS) and the **Backend** (Python FastAPI).

## 1. Deploying the Frontend (Static Web Hosting)
Since your frontend consists only of static files (`index.html`, `styles.css`, `script.js`), it can be hosted on any static file hosting service. Some popular and free options include:
- **Vercel** (Recommended)
- **Netlify**
- **GitHub Pages**

### Vercel / Netlify Deployment Steps:
1. Initialize a Git repository in your `frontend` folder.
2. Push your code to a new GitHub repository.
3. Go to Vercel or Netlify and securely import that GitHub repository.
4. Keep the build command empty, and set the publish directory to `/`.
5. Deploy! You will receive a live URL where your frontend is available.

## 2. Deploying the Backend (Python FastAPI)
Your backend must be hosted somewhere that can run Python servers. Free/Low-cost choices include:
- **Render**
- **Railway**
- **Heroku** (Paid only)

### Render Deployment Steps:
1. Push your `backend/` folder (including `requirements.txt` and the main pipeline `.py` file) into a GitHub repository.
2. Create a new "Web Service" on Render.com and connect it to your GitHub repo.
3. Configure it as a **Python** environment.
4. Set the Build Command: `pip install -r requirements.txt`
5. Set the Start Command: `uvicorn main:app --host 0.0.0.0 --port 10000` *(assuming your backend file is `main.py`)*.
6. Deploy! Make sure your backend `.py` file includes CORS middleware allowing requests from your new frontend URL.

## 3. Connecting Frontend to Backend
Once you have deployed your Backend API, update the `API_URL` variable in `frontend/script.js`. 

In `script.js`, locate:
```javascript
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:8000/detect_anomalies'
    : 'https://your-production-app-url.com/detect_anomalies'; // TODO: Update this for production
```
Replace the placeholder with your **actual** production backend URL (created in Step 2).

### Summary of Bug Fixes Included:
- **Continuous Scrolling on PC**: Fixed infinite loop layout redraws caused by Chart.js resizing inside an unconstrained flexible container by isolating it inside `.canvas-wrapper`.
- **Mobile View**: Added `@media` media queries to automatically flip the dashboard sections into columns when viewed on mobile screens.
- **Empty Graph Crash**: Added safeguards inside `script.js` to ensure the table and graph plotting doesn't crash the script if evaluating empty data matrices.
