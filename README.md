# Notes REST API

## Run
```
npm install
npm start
```
Server starts at http://localhost:3000

## Endpoints (test in Postman)
| Method | URL | Body (JSON) |
|---|---|---|
| POST | /notes | {"title": "Buy milk", "content": "2 litres"} |
| GET | /notes | none (optional ?search=milk) |
| GET | /notes/1 | none |
| PUT | /notes/1 | {"title": "New title"} and/or {"content": "New text"} |
| DELETE | /notes/1 | none |

In Postman, set Body to raw > JSON for POST and PUT.
Notes are saved in data/notes.json.
