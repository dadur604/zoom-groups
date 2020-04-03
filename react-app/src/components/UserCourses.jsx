import React from "react";
import CourseListing from "./CourseListing.jsx";
import "bootstrap/dist/css/bootstrap.css";

class UserCourses extends React.Component {
  constructor(props) {
    super(props);
    this.Courses = [
      {
        courseTitle: "Course 3A",
        zoomLink: "zoom.us/blah"
      },
      {
        courseTitle: "Course 3B",
        zoomLink: "zoom.us/blah"
      },
      {
        courseTitle: "Course 3C",
        zoomLink: "zoom.us/blah"
      }
    ];
  }

  render() {
    return (
      <div className="UserCourses">
        <div class="row">
          <h2>My classes</h2>
        </div>
        <div id="classes">{this.renderCourses()}</div>
      </div>
    );
  }

  renderCourses() {
    if (this.Courses.length === 0) {
      return (
        <div class="row">
          <p>You're not subscribed to any classes.</p>
        </div>
      );
    } else {
      return this.Courses.map(course => <CourseListing course={course} />);
    }
  }
}

export default UserCourses;
