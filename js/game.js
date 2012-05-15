var _canvas = undefined;
var _buffer = undefined;
var canvas = undefined;
var buffer = undefined;
var fieldWidth = 0;
var fieldHeight = 0;
var measureFPS = true;
var debug = true;

// variables for fps measurements
var fps = 0, now, lastUpdate = (new Date)*1 - 1;
// Smooths out fps rate so minor hickups don't kill it
var fpsFilter = 50;

var directions = {up:{value:0},down:{value:1},left:{value:2},right:{value:3}};
var snowLevels = {blizzard:{value:30,name:'blizzard'},high:{value:15,name:'high'},medium:{value:8,name:'medium'},low:{value:2,name:'low'}};
var flakeSizes = {small:{value:0,name:'small'},medium:{value:1,name:'medium'},large:{value:2,name:'large'}};

// Use requestAnimFrame and fallback to setTimeout if not supported
window.requestAnimFrame = ( function() {
	return  window.requestAnimationFrame || 
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame || 
	window.msRequestAnimationFrame ||
	function( callback ){ window.setTimeout(callback, 1000 / 60); };
} )();


// parse input
function inputHandler(event) {
	switch(event.keyCode) {
		case 37: //left arrow
			break;
		case 38: // up arrow
			break;
		case 39: // right arrow
			break;
		case 40: // down arrow
			break;
		case 49: // 1
			break;
		case 50: // 2
			break;
		case 51: // 3
			break;
		case 52: // 4
			break;
		case 66: // B
			if (event.type == 'keydown') {
				game.Blizzard();
			}
			break;
		case 68: // D
			if (event.type == 'keydown') {
				game.DecreaseSnow();
			}
			break;
		case 73: // I
			if (event.type == 'keydown') {
				game.IncreaseSnow();
			}
			break;
		case 112: // p - lowercase
			game.Pause();
			break;
		case 83: // S
			if (event.type == 'keydown') {
				game.ToggleSnow();
			}
			break;
		case 27: // escape
			game.LoadMenu();
			break;
		default:
			console.log(event.keyCode);
			break;
	}
}

function MouseHandler(event,paddle,playfield) {
	if (game.paused == false) {
		paddle.SetDirection(event.pageX);
	}
}

function Game() {
	var self = this;
	var playfield = undefined;
	this.balls = [];
	var paddle = undefined;
	this.snow = [];
	var snowStatus = true;
	var snowDensity = snowLevels.low;
	var scoreboard = undefined;
	this.gameLoop = undefined;
	this.snowLoop = undefined;
	this.ballLoop = undefined;
	this.interval = undefined;
	this.splashTimer = undefined;
	this.paused = false;
	this.score = 0;
	this.scores = [];
	this.ready = false;
	
	this.Run = function() {
		this.Initialize();
	}
	
	this.Initialize = function() {
		console.log('Begin Initialization');
		_canvas = document.getElementById('playfield');
		if (_canvas && _canvas.getContext){
			canvas = _canvas.getContext('2d');

			_buffer = document.createElement('canvas');
			_buffer.width = _canvas.width;
			_buffer.height = _canvas.height;
			buffer = _buffer.getContext('2d');

			buffer.strokeStyle = "rgb(255, 255, 255)";
			buffer.fillStyle = "rgb(0, 0, 0)";
			buffer.font = "16px Basic";
		}
		
		// Create event handler
		$(document).keypress(function(e) {
			e.preventDefault();
			inputHandler(e);
		});
		
		playfield = new Playfield();
		playfield.LoadImage('images/map.jpg');
		scoreboard = new Scoreboard();
		scoreboard.LoadImage('images/scorepanel.jpg');
		paddle = new Paddle();
		paddle.LoadImage('images/paddle.png');
		this.MakeBalls();
		
		this.interval = setInterval(self.InitialUpdateRun,this.checkInterval);
	}
	
	this.InitialUpdateRun = function() {
		if (playfield.Loaded() && self.balls[0].Loaded() && paddle.Loaded() && scoreboard.Loaded()) {
			clearInterval(self.interval);
			$(document).mousemove(function(e) {
				e.preventDefault();
				MouseHandler(e,paddle,playfield);
			});
			
			// Start game loop
			self.Loop();
			self.snowLoop = setInterval(self.SnowLoop,500);
			self.ballLoop = setInterval(self.BallLoop,5000);
		}
	}
	
	this.ShowSplash = function(image,context) {
		context.drawImage(image,0,100);
	}
	
	this.Loop = function() {
		requestAnimFrame(self.Loop);
		self.Update();
		self.Draw();
	}
	
	this.SnowLoop = function() {
		if (snowStatus && self.paused == false) {
			self.MakeSnow();
		}
	}
	
	this.BallLoop = function() {
		if (self.paused == false) {
			self.MakeBalls();
		}
	}
	
	this.Update = function() {
		if (self.paused == false) {
			if (snowStatus) {
				self.MoveSnow();
			}
			
			if (self.scores) {
				self.MoveScores();
			}
			
			self.MoveBalls(paddle);
			if (!paddle.DetectCollision(playfield)) {
				paddle.Move();
			}
		}
	}
	
	this.Draw = function() {
		buffer.clearRect(0, 0, _buffer.width, _buffer.height);
		canvas.clearRect(0, 0, _canvas.width, _canvas.height);
		
		// draw ball & paddle
		playfield.Draw(buffer);
		scoreboard.Draw(buffer);
		this.DrawBalls(this.balls,buffer);
		
		if (this.scores) {
			this.DrawScores(this.scores,buffer);
		}
		paddle.Draw(buffer);
		if (snowStatus) {
			this.DrawSnow(this.snow,buffer);
		}
		this.DrawScore(buffer,scoreboard);
		
		// Draw buffer to canvas
		canvas.drawImage(_buffer, 0, 0);
		
		// FPS measurement
		if (measureFPS == true) {
			var thisFrameFPS = 1000 / ((now=new Date) - lastUpdate);
			fps += (thisFrameFPS - fps) / fpsFilter;
			lastUpdate = now;
		}
	}
	
	this.LoadMenu = function() {
		console.log('Menu Loaded');
	}
	
	this.MakeBalls = function() {		
		var tempBall = new Ball();
		tempBall.LoadImage('images/ball.png');
		this.balls.push(tempBall);
	}
	
	this.MoveBalls = function(paddle) {
		for(i=0;i<this.balls.length;i++) {
			if(!this.balls[i].DetectCollision(paddle)) {
				this.balls[i].Move();
				if (this.balls[i].y > fieldHeight) {
					this.balls.splice(i,1);
				}
			} else {
				this.scores.push(new Score(this.balls[i].x,this.balls[i].y));
				this.balls.splice(i,1);
			}
		}
	}
	
	this.DrawBalls = function(balls,context) {
		for(i=0;i<balls.length;i++) {
			if (balls[i].Loaded) {
				balls[i].Draw(context);
			}
		}
	}
	
	this.MakeSnow = function() {
		var self = this;
		for(i=0;i<snowDensity.value;i++) {
			var flake = new Snowflake();
			flake.LoadImage();
			this.snow.push(flake);
		}
	}
	
	this.MoveSnow = function() {
		console.log('test');
		for(i=0;i<this.snow.length;i++) {
			this.snow[i].Move();
			if (this.snow[i].y > fieldHeight) {
				this.snow.splice(i,1);
			}
		}
	}
	
	this.DrawSnow = function(snowflakes,context) {
		for(i=0;i<snowflakes.length;i++) {
			if (snowflakes[i].Loaded) {
				snowflakes[i].Draw(context);
			}
		}
	}
	
	this.MoveScores = function() {
		for(i=0;i<this.scores.length;i++) {
			this.scores[i].Move();
			if (this.scores[i].y < this.scores[i].minY) {
				this.UpdateScore(this.scores[i].value);
				this.scores.splice(i,1);
			}
		}
	}
	
	this.DrawScores = function(scores,context) {
		for(i=0;i<scores.length;i++) {
			scores[i].Draw(context);
		}
	}
	
	this.UpdateScore = function(value) {
		this.score += value;
	}
	
	this.DrawScore = function(context,scoreboard) {
		context.fillText("Score: " + this.score,scoreboard.x + 30,scoreboard.y + 100);
	}
	
	this.DecreaseSnow = function() {
		if (snowDensity == snowLevels.low) {
			return false;
		}
		if (snowDensity == snowLevels.high) {
			snowDensity = snowLevels.medium;
		} else {
			snowDensity = snowLevels.low;
		}
		console.log('Snow Level: ' + snowDensity.name);
	}
	
	this.IncreaseSnow = function() {
		if (snowDensity == snowLevels.high) {
			return false;
		}
		if (snowDensity == snowLevels.low) {
			snowDensity = snowLevels.medium;
		} else {
			snowDensity = snowLevels.high;
		}
		console.log('Snow Level: ' + snowDensity.name);
	}
	
	this.Blizzard = function() {
		snowDensity = snowLevels.blizzard;
		console.log('Snow Level: ' + snowDensity.name);
	}
	
	this.ToggleSnow = function() {
		snowStatus = !snowStatus;
	}
	
	this.Pause = function() {
		if (this.paused == false) {
			this.paused = true;
		} else {
			this.paused = false;
		}
	}
}

function Ball() {
	this.y = -100;
	this.directionY = directions.down;
	this.speed = 3;
	this.value = 100;
	console.log(this);
	
	this.LoadImage = function(imgSrc) {
		var self = this;
		var image = new Image();
		image.src = '';
		image.src = imgSrc;
		
		image.onload = function() {
			self.image = image;
			self.width = image.width;
			self.height = image.height;
			self.x = Math.floor(Math.random() * (fieldWidth - self.width));
			self.loaded = true;
		}
	}
	
	this.Move = function() {
		if (this.paused == false) {
			this.y += this.speed;
		}
	}
	
	this.Lost = function() {
		// Call this when ball goes out of bounds
	}
}

function Paddle() {
	this.x = 20;
	this.xTarget = 50;
	this.y = 580;
	this.direction = directions.left;
	this.speed = 5;
	console.log(this);
	
	this.GetCenter = function() {
		var response = this.x + ((this.width + this.speed) / 2);
		return response;
	}
	
	this.SetDirection = function(targetX) {
		if (this.GetCenter() < targetX) {
			this.direction = directions.right;
		} else if (this.GetCenter() > targetX) {
			this.direction = directions.left;
		}
		this.xTarget = targetX;
	}
	
	this.DetectCollision = function(target) {
		if (this.x - this.speed < 0 && this.direction == directions.left) {
			if (debug) {
				console.log('Paddle Collision - Left: x=' + this.x);
			}
			this.x = 0;
			return 1;
		}
		if (this.x + this.width + this.speed > target.width && this.direction == directions.right) {
			if (debug) {
				console.log('Paddle Collision - Right: x=' + this.x);
			}
			this.x = target.width - this.width;
			return 1;
		}
		return 0;
	}
	
	this.Move = function() {
		if (this.paused == false) {
			if (this.direction == directions.left) {
				if (this.GetCenter() - this.speed < this.xTarget) {
					// Partial Movement
					this.direction = undefined;
				} else {
					// Full movement space
					this.x -= this.speed;
				}
			}
			if (this.direction == directions.right) {
				if (this.GetCenter() + this.speed > this.xTarget) {
					// Partial Movement
					this.direction = undefined;
				} else {
					// Full movement space
					this.x += this.speed;
				}
			}
		}
	}
	
	this.Pause = function() {
		if (paused == false) {
			// stop paddle movement
			this.xTarget = this.x;
			paused = true;
		} else {
			paused = false;
		}
	}
}

function Snowflake() {
	this.xOrigin = 0;
	this.xDirection = directions.left;
	this.y = -100; // spawn off the playfield so it won't be visible
	this.size = Math.floor(Math.random() * (Object.keys(flakeSizes).length));
	this.xRange = Math.floor(Math.random() * 50);
	this.speed = Math.floor(Math.random() * 3);
	console.log(this);
	
	this.PickDirection = function() {
		return directions.left;
	}
	
	this.LoadImage = function() {
		var self = this;
		var image = new Image();
		image.src = '';
		if (self.size == 0) {
			image.src = 'images/snowflakeSmall.png';
		} else if (self.size == 1) {
			image.src = 'images/snowflakeMedium.png';
		} else if (self.size == 2) {
			image.src = 'images/snowflakeLarge.png';
		}
		
		image.onload = function() {
			self.image = image;
			self.width = image.width;
			self.height = image.height;
			self.x = Math.floor(Math.random() * (fieldWidth - self.width));
			if (self.x + self.xRange > fieldWidth) { self.xRange = fieldWidth - self.x; }
			if (self.speed < 1) { self.speed = 1; }
			self.y = Math.floor(Math.random() * -100);
			self.xOrigin = self.x;
			self.xDirection = self.PickDirection();
			self.loaded = true;
		}
	}
	
	this.Move = function() {
		if (this.xDirection == directions.left) {
			if (this.x > this.xOrigin - this.xRange) {
				this.x -= 1;
			} else {
				this.xDirection = directions.right;
			}
		}
		if (this.xDirection == directions.right) {
			if (this.x < this.xOrigin + this.xRange) {
				this.x += 1;
			} else {
				this.xDirection = directions.left;
			}
		}
		this.y += this.speed;
	}
}

function Playfield() {
	console.log(this);
	
	this.LoadImage = function(imgSrc) {
		var self = this;
		var image = new Image();
		image.src = '';
		image.src = imgSrc;
		
		image.onload = function() {
			self.image = image;
			fieldWidth = image.width;
			fieldHeight = image.height;
			self.width = image.width;
			self.height = image.height;
			self.loaded = true;
		}
	}
}

function Scoreboard() {
	this.x = 480;
	console.log(this);
}

function Score(x,y) {
	this.value = 100;
	this.x = x;
	this.y = y;
	this.minY = y - 50;
	this.speed = 5;
	
	this.Move = function() {
		this.y -= this.speed;
	}
	
	this.Draw = function(context) {
		context.fillText(this.value,this.x,this.y);
	}
}

function Drawable() {
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;
	this.loaded = false;
	this.paused = false;
	this.image = undefined;
	
	this.LoadImage = function(imgSrc) {
		var self = this;
		var image = new Image();
		image.src = '';
		image.src = imgSrc;
		
		image.onload = function() {
			self.image = image;
			self.width = image.width;
			self.height = image.height;
			self.loaded = true;
		}
	}
	
	this.Loaded = function() {
		return this.loaded;
	}
	
	this.Pause = function() {
		// stop the ball
		if (this.paused == true) {
			this.paused = false;
		} else {
			this.paused = true;
		}
	}
	
	this.DetectCollision = function(target) {
		if (!((this.x + this.width) >= target.x)) {
			return 0;
		}
		if (!(this.x <= (target.x + target.width))) {
			return 0;
		}
		if (!((this.y + this.height) >= target.y)) {
			return 0;
		}
		if (!(this.y <= (target.y + target.height))) {
			return 0;
		}
		return 1;
	}
	
	this.Draw = function(context) {
		context.drawImage(this.image,this.x,this.y);
	}
}

Ball.prototype = new Drawable();
Ball.prototype.constructor = Drawable;
Snowflake.prototype = new Drawable();
Snowflake.prototype.constructor = Drawable;
Playfield.prototype = new Drawable();
Playfield.prototype.constructor = Drawable;
Scoreboard.prototype = new Drawable();
Scoreboard.prototype.constructor = Drawable;
Paddle.prototype = new Drawable();
Paddle.prototype.constructor = Drawable;