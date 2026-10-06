# 🎨 Sakshi Lad | Original Art Portfolio

A dynamic, full-stack web application built to showcase original acrylic paintings, track user engagement analytics, and securely manage commission requests. 

This project transitions a static frontend portfolio into a data-driven platform using React, Node.js, Express, and MongoDB.

---

## ✨ Features

### Frontend (Client)
* **Dynamic Art Gallery:** A fully responsive grid displaying artworks with dynamic pagination.
* **Interactive Viewers:** Custom modals preventing image theft (disabled right-click/drag) while displaying rich artwork details and pricing.
* **Animated UI:** Smooth scroll mechanics, animated stat counters that trigger on-scroll, and custom CSS environmental glows.
* **SEO Optimized:** Injected Open Graph (OG) and Twitter meta tags for highly professional social media link sharing.
* **Smart Commission Form:** Built-in form validation, intelligent button loading states (preventing spam), and animated toast notifications.

### Backend (Server)
* **Behavioral Analytics Tracking:** Custom endpoints silently log which paintings users view and which social platforms they click to buy from.
* **Secure Lead Routing:** Commission form submissions are securely routed directly into a MongoDB database rather than relying on client-side mailto links.
* **Real-time Email Alerts:** Integrated `nodemailer` automatically dispatches a formatted email notification to the artist the moment a new commission is requested.

---

## 🛠 Tech Stack

**Frontend:** React, Vite, JavaScript, CSS, Lucide-React (Icons)  
**Backend:** Node.js, Express.js, Nodemailer (Email Routing)  
**Database:** MongoDB Atlas, Mongoose ODM  

---

## 🚀 Local Development Setup

To run this project locally, you will need to start both the frontend and backend servers simultaneously in two separate terminal windows.

### 1. Backend Setup (Server)
The backend runs on **Port 5001** to prevent conflicts with local development environments.

```bash
cd server
npm install