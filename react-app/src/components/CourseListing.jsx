import React from "react";
import "bootstrap/dist/css/bootstrap.css";
import "./CourseListing.css";

class CourseListing extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="CourseListing">
        <div class="row">
          <div class="card course-card">
            <div class="card-body">
              <h5 class="card-title"> {this.props.course.courseTitle} </h5>
              <p class="card-text">
                Link is live at {this.props.course.courseTime} PST
              </p>
              <a href={this.props.course.zoomLink} class="btn btn-primary">
                Join Zoom
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CourseListing;
