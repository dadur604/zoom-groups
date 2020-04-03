const functions = require('firebase-functions');
// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

const requestHTTP = require("request");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// Zoom oauth callback
exports.zoomAuth = functions.https.onRequest(async (request, response) => {
  var code = request.query.code;
  if (!code) { console.log(request.query); console.log(request.body); return; }
  console.log("Client Code: " + code);
  
  const redirect_uri = "https://us-central1-zoomgroups-lahacks2020.cloudfunctions.net/zoomAuth";
  const app_client_id = functions.config().zoom_client.id;
  const app_client_secret = functions.config().zoom_client.secret;

	var authOptions = {
	  method: 'POST',
	  url: 'https://api.zoom.us/oauth/token',
	  qs: {
	   grant_type: 'authorization_code',
	   //The code below is a sample authorization code. Replace it with your actual authorization code while making requests.
	   code: code,
		//The uri below is a sample redirect_uri. Replace it with your actual redirect_uri while making requests.
	   redirect_uri: redirect_uri
	  },
	  headers: {
		/**The credential below is a sample base64 encoded credential. Replace it with "Authorization: 'Basic ' + Buffer.from(your_app_client_id + ':' + your_app_client_secret).toString('base64')"
		**/
	   Authorization: 'Basic ' + Buffer.from(app_client_id + ':' + app_client_secret).toString('base64')
	  }
	};

	var authPromise = new Promise((resolve, reject) => {
	  requestHTTP(authOptions, function(error, response, body) {
	   if (error) { console.log(error); throw new Error(error);}
		console.log("Authorized! " + body);
		var jsonBody = JSON.parse(body);
	   resolve(jsonBody);
	  });
	});
	var auth = await authPromise;
	var auth_token = auth.access_token;
	var refresh_token = auth.refresh_token;
	// Save the auth token!
		
	var userOptions = {
	  method: 'GET',
	  url: 'https://api.zoom.us/v2/users/me',
	  headers: {
		/**The credential below is a sample base64 encoded credential. Replace it with "Authorization: 'Basic ' + Buffer.from(your_app_client_id + ':' + your_app_client_secret).toString('base64')"
		**/
	   Authorization: 'Bearer ' + auth_token
	  }
	};
	
	var userPromise = new Promise((resolve, reject) => {
	  requestHTTP(userOptions, function(error, response, body) {
	   if (error) {console.log(error); throw new Error(error); }
		console.log("Got User Info! " + body);
		var jsonBody = JSON.parse(body);
	   resolve(jsonBody);
	  });
	});

	var user = await userPromise;
	var user_id = user.id;
	var user_email = user.email;
	var user_pic_url = user.pic_url;
	
	console.log("user id is " + user_id);
	
	var snapshot = await admin.database().ref('/users').child(user_id).set({id: user_id,
	token: auth_token,
	email: user_email,
	pic: user_pic_url});
	
	const redirect_login = "https://zoomgroups-lahacks2020.appspot.com";
	
    response.redirect(302, redirect_login + "?zoomid=" + user_id);
});

exports.makeMeeting = functions.https.onRequest(async (request, response) => {
	var meeting_topic = request.query.meeting_topic;
	var auth_token = request.query.auth_token;
	var zoomOptions = {
	  method: 'POST',
	  url: 'https://api.zoom.us/v2/users/me/meetings',
	  headers: {
		/**The credential below is a sample base64 encoded credential. Replace it with "Authorization: 'Basic ' + Buffer.from(your_app_client_id + ':' + your_app_client_secret).toString('base64')"
		**/
	   Authorization: 'Bearer ' + auth_token
	  },
	  body: {
		"topic": meeting_topic,
		"type": 1
	  },
	  json: true
	};
	
	var zoomPromise = new Promise((resolve, reject) => {
	  requestHTTP(zoomOptions, function(error, response, body) {
	   if (error) {console.log(error); throw new Error(error); }
		console.log("Made Zoom Meeting! " + body);
		console.log(body);
		//var jsonBody = JSON.parse(body);
	   resolve(body);
	  });
	});
	
	var zoom = await zoomPromise;
	var start_url = zoom.start_url;
	var join_url = zoom.join_url;
	
	console.log(zoom);
	
	var snapshot = await admin.database().ref('/classes').child(meeting_topic).set({id: join_url});
});

const cors = require('cors')({ origin: true, });   

exports.getList = functions.https.onRequest(async (request, response) => {
	cors(request, response, () => {

	});
	response.set('Access-Control-Allow-Origin', 'https://zoomgroups-lahacks2020.appspot.com');
    response.set('Access-Control-Allow-Credentials', 'true');
	response.set('Access-Control-Allow-Methods', 'GET, POST');
	
	var filterText = request.body.inputText;
	console.log(filterText);
	
	var outputCourses = [];
	
	var ref = admin.database().ref('/courses');
	var dataPromise = new Promise((resolve, reject) => {
		ref.once("value", function(data) {
			var courses = data.val();
			for (const key in courses) {
				var course = courses[key];
				var searchstr = course.courseTitle; //+ course.courseTitle + course.professor;
				searchstr = searchstr.toLowerCase();
				console.log(searchstr);
				if (searchstr.includes(filterText.toLowerCase())) {
					if (outputCourses.push({courseID: key, courseNum: course.courseTitle, ...course}) == 10) {
						response.send(outputCourses);
						return;
					}
				}
			}
			resolve();
		});
	});

	await dataPromise;
	
	response.send(outputCourses);
	return;
	
	console.log(request.body);


	response.send(["Item A", "Item B", "Item C", "Item D", "Item E", "Item F"]);
});

exports.updateCourses = functions.https.onRequest(async (request, response) => {
	var options = {
	  method: 'GET',
	  url: 'http://api.ucladevx.com/courses'
	};
	
	var getPromise = new Promise((resolve, reject) => {
	  requestHTTP(options, function(error, response, body) {
	   if (error) {console.log(error); throw new Error(error); }
		console.log(body);
		var jsonBody = JSON.parse(body);
		
		resolve(jsonBody);
		});
	});
	
	var jsonBody = await getPromise;
	
	console.log(typeof jsonBody);
	
	var courses = {};
	console.log(jsonBody);
	jsonBody.forEach((course) => {
		if (course.quarter != "20S" && course.muarter != "20S") return;
		courses[course._id.$oid] = {
			courseTitle: course.courseTitle,
			courseNum: course.courseNum,
			professor: course.professor,
			major: course.major
		};
	});
	
	console.log(courses);
	
	await admin.database().ref('/courses').set(courses);	
	
	response.send("OK");
});

exports.subscribeCourse = functions.https.onRequest(subscribeCourse);
async function subscribeCourse(request, response) {
	var user = request.body.user;
	var course = request.body.course;
	
	var found = false;
	
	await admin.database().ref('/users').child(user).child("courses").once("value", (data) => {
		var courses = data.val();
		for (const key in courses) {
			if (courses[key] == course) {
				found = true;
			}
		}
	});
	
	if (found === false) {
		await admin.database().ref('/users').child(user).child("courses").push(course);
	}
}

exports.getCoursesOfUser = functions.https.onRequest(async (request, response) => {
  var user = request.body.user;
  
  var output = [];
  
  new Promise(async (resolve, reject) => {
    
    await admin.database().ref('/users').child(user).child("courses").once("value", async (data) => {
   var courses = data.val();
		for (const key in courses) {
      
      var course = courses[key];
      console.log(course);
      var courseInfo;
      await admin.database().ref('/courses').child(course).once("value", async (data) => { console.log(data.val()); courseInfo = data.val(); });
			if (user == courseInfo.host) {
				courseInfo.zoomLink = courseInfo.hostLink;
			}
			
			output.push({
        courseID: course,
        ...courseInfo
      });
    }
      resolve();
  });
    
  }).then (() => {
      // now we have output array  
  		response.send(output); 
  })
});

exports.addCourse = functions.https.onRequest(async (request, response) => {
  var user = request.body.user;
  var className = request.body.className;
  var professor = request.body.professor;
  var time = request.body.time;
  var days = request.body.days;
  
  var userInfo;
  await admin.database().ref('/users').child(user).once("value", async (data) => { console.log(data.val()); userInfo = data.val(); });
  
  var auth_token = userInfo.token;
  
  var meetingOptions = {
	  method: 'POST',
	  url: 'https://api.zoom.us/v2/users/me/meetings',
	  headers: {
	   Authorization: 'Bearer ' + auth_token
	  },
    body: {
      "type": 1,
      "topic": className + " - " + professor
    },
    json: true
	};
	
	var meetingPromise = new Promise((resolve, reject) => {
	  requestHTTP(meetingOptions, function(error, response, body) {
	   if (error) {console.log(error); throw new Error(error); }
		console.log("Got User Info! " + body);
	   resolve(body);
	  });
	});
  
  var meetingResponse = await meetingPromise;
  
  console.log(meetingResponse); 
  
  var join_url = meetingResponse.join_url;
  
  var regex = /https:\/\/us04web.zoom.us\/j\/(\w+)\?pwd=(\w+)/;
  var matches = regex.exec(join_url);
  var confno, pwd;
  if (matches) {
    confno = matches[1];
    pwd = matches[2];
  }
  
  var join_url_direct = `zoommtg://zoom.us/join?confno=${confno}&pwd=${pwd}`;
  
  var classObject = {
    courseTitle: className,
    professor: professor,
    courseTime: time,
    courseDays: days,
    host: user,
    zoomLink: join_url_direct,
    hostLink: meetingResponse.start_url
  };
  
  var newClass = await admin.database().ref('/courses').push(classObject);
  
  subscribeCourse({body:{user:user,course:newClass.key}});
  
  response.send(newClass.key);
});