import React from "react";
import logo from "./logo.svg";
import "bootstrap/dist/css/bootstrap.css";
import "./App.css";
import UserCourses from "./components/UserCourses.jsx";

function App() {
  return (
    <div className="App">
      <main role="main" class="container">
        <h1 class="starter">Class Manager</h1>
        <div class="justify">
          <div
            class="col-sm-6"
            style={{
              "padding-right": "2rem",
              "border-right": "2px solid #ccc"
            }}
          >
            <UserCourses />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
