# System Overview

## Architecture

Frontend:
React + Vite

Backend:
Node.js + Express.js

Operational Database:
MongoDB

Audit / Logging Database:
MySQL

## Communication Flow

React Client
↓ HTTP Requests
Express API
↓
MongoDB + MySQL

## Authentication

JWT-based authentication using access tokens.

## Repository Strategy

Monorepo structure:
/client
/server
/docs