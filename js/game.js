var _canvas = undefined;
var _buffer = undefined;
var canvas = undefined;
var buffer = undefined;
var fieldWidth = 0;
var fieldHeight = 0;

var directions = {up:{value:0},down:{value:1},left:{value:2},right:{value:3}};
var commands = {start:{value:'start'},stop:{value:'stop'}};
var snowLevels = {blizzard:{value:30,name:'blizzard'},high:{value:15,name:'high'},medium:{value:8,name:'medium'},low:{value:2,name:'low'}};

// parse input
function inputHandler(event,paddle,ball) {
	switch(event.keyCode) {
		case 37: //left arrow
			if (event.type == 'keydown') {
				paddle.SetDirection(commands.start,directions.left);
			} else {
				paddle.SetDirection(commands.stop,directions.left);
			}
			break;
		case 38: // up arrow
			if (event.type == 'keydown') {
				paddle.SetDirection(commands.start,directions.up);
			} else {
				paddle.SetDirection(commands.stop,directions.up);
			}
			break;
		case 39: // right arrow
			if (event.type == 'keydown') {
				paddle.SetDirection(commands.start,directions.right);
			} else {
				paddle.SetDirection(commands.stop,directions.right);
			}
			break;
		case 40: // down arrow
			if (event.type == 'keydown') {
				paddle.SetDirection(commands.start,directions.down);
			} else {
				paddle.SetDirection(commands.stop,directions.down);
			}
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
		case 80: // P
			if (event.type == 'keydown') {
				game.Pause();
			}
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
	this.paused = false;
	this.score = 0;
	this.scores = [];
	this.ready = false;
	
	this.Run = function() {
		this.Initialize();
	}
	
	this.Initialize = function() {
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
		$(document).keydown(function(e) {
			e.preventDefault();
			inputHandler(e,paddle);
		});
		$(document).keyup(function(e) {
			e.preventDefault();
			inputHandler(e,paddle);
		});
		
		playfield = new Playfield();
		scoreboard = new Scoreboard();
		paddle = new Paddle();
		this.MakeBalls();
		
		this.interval = setInterval(self.InitialUpdateRun,this.checkInterval);
	}
	
	this.InitialUpdateRun = function() {
		if (playfield.Loaded() && self.balls[0].Loaded() && paddle.Loaded() && scoreboard.Loaded()) {
			clearInterval(self.interval);
			
			// Start game loop
			self.gameLoop = setInterval(self.Loop,30);
			self.snowLoop = setInterval(self.SnowLoop,500);
			self.ballLoop = setInterval(self.BallLoop,5000);
		}
	}
	
	this.Loop = function() {
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
			
			//ball.DetectCollision(scoreboard);
			self.MoveBalls(paddle);
			paddle.Move();
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
	}
	
	this.LoadMenu = function() {
		console.log('Menu Loaded');
	}
	
	this.MakeBalls = function() {
		var ball = new Ball();
		this.balls.push(ball);
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
	
	this.MakeSnow = function() {
		for(i=0;i<snowDensity.value;i++) {
			var flake = new Snowflake();
			flake.Load();
			this.snow.push(flake);
		}
	}
	
	this.MoveSnow = function() {
		for(i=0;i<this.snow.length;i++) {
			this.snow[i].Move();
			if (this.snow[i].y > fieldHeight) {
				this.snow.splice(i,1);
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
	
	this.DrawSnow = function(snowflakes,context) {
		for(i=0;i<snowflakes.length;i++) {
			snowflakes[i].Draw(context);
		}
	}
	
	this.DrawBalls = function(balls,context) {
		for(i=0;i<balls.length;i++) {
			balls[i].Draw(context);
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
	var self = this;
	var image = new Image();
	image.src = '';
	image.src = 'images/ball.png';
	this.x = 0;
	this.y = -100;
	this.width = 0;
	this.height = 0;
	this.directionY = directions.down;
	this.speed = 3;
	this.paused = false;
	this.value = 100;
	var _loaded = false;
	
	image.onload = function() {
		self.width = image.width;
		self.height = image.height;
		self.x = Math.floor(Math.random() * (fieldWidth - self.width));
		self.y = Math.floor(Math.random() * -100);
		_loaded = true;
	}
	
	this.Loaded = function() {
		return _loaded;
	}
	
	this.DetectCollision = function(target,callback) {
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
	
	this.Move = function() {
		if (this.paused == false) {
			this.y += this.speed;
		}
	}
	
	this.Draw = function(context) {
		context.drawImage(image,this.x,this.y);
	}
	
	this.Pause = function() {
		// stop the ball
		if (this.paused == true) {
			this.paused = false;
		} else {
			this.paused = true;
		}
	}
	
	this.Lost = function() {
		// Call this when ball goes out of bounds
	}
}

function Paddle() {
	var self = this;
	var image = new Image();
	image.src = '';
	image.src = 'images/paddle.png';
	this.x = 20;
	this.y = 580;
	this.width = 0;
	this.height = 0;
	this.movingLeft = false;
	this.movingRight = false;
	this.direction = undefined;
	this.speed = 3;
	var paused = false;
	var _loaded = false;
	
	image.onload = function(event) {
		self.width = image.width;
		self.height = image.height;
		_loaded = true;
	}
	
	this.Loaded = function() {
		return _loaded;
	}
	
	this.Draw = function(context) {
		context.drawImage(image,this.x,this.y);
	}
	
	this.SetDirection = function(command,direction) {
		if (paused == false) {
			if (command == commands.start) {
				if (direction == directions.left) {
					this.movingLeft = true;
				}
				if (direction == directions.right) {
					this.movingRight = true;
				}
			}
			if (command == commands.stop) {
				if (direction == directions.left) {
					this.movingLeft = false;
				}
				if (direction == directions.right) {
					this.movingRight = false;
				}
			}
		}
	}
	
	this.DetectCollision = function() {
		
	}
	
	this.Move = function() {
		if (this.movingLeft == true || this.movingRight == true) {
			if (this.movingLeft == true) {
				if (this.x - this.speed >= 0) {
					this.x -= this.speed;
				} else {
					this.x = 0;
				}
			}
			if (this.movingRight == true) {
				if (this.x + image.width + this.speed <= fieldWidth - this.speed) {
					this.x += this.speed;
				} else {
					this.x = fieldWidth - image.width;
				}
			}
		}
	}
	
	this.Pause = function() {
		if (paused == false) {
			// stop paddle and then pause
			this.movingLeft = false;
			this.movingRight = false;
			paused = true;
		} else {
			paused = false;
		}
	}
}

function Snowflake() {
	var self = this;
	var image = new Image();
	image.src = '';
	this.x = 0;
	this.y = -100; // spawn off the playfield so it won't be visible
	this.size = Math.floor(Math.random() * 3);
	this.speed = 3;
	this.width = 0;
	var paused = false;
	var collidable = false;
	var _loaded = false;
	
	this.Load = function() {
		if (this.size == 0) {
			image.src = 'images/snowflakeSmall.png';
		} else if (this.size == 1) {
			image.src = 'images/snowflakeMedium.png';
		} else {
			image.src = 'images/snowflakeLarge.png';
		}
	}
	
	image.onload = function() {
		self.width = image.width;
		self.x = Math.floor(Math.random() * (fieldWidth - self.width));
		self.y = Math.floor(Math.random() * -100);
		_loaded = true;
	}
	
	this.Loaded = function() {
		return _loaded;
	}
	
	this.Draw = function(context) {
		context.drawImage(image,this.x,this.y);
	}
	
	this.Move = function() {
		if (paused == false) {
			this.y += this.speed;
		}
	}
	
	this.Pause = function() {
		if (paused == false) {
			paused = true;
		} else {
			paused = false;
		}
	}
}

function Playfield() {
	var image = new Image();
	image.src = '';
	image.src = 'images/map.jpg';
	var _loaded = false;
	
	this.Loaded = function() {
		return _loaded;
	}
	
	image.onload = function() {
		_loaded = true;
		fieldWidth = image.width;
		fieldHeight = image.height;
	}
	
	this.Draw = function(context) {
		context.drawImage(image,0,0);
	}
}

function Scoreboard() {
	var image = new Image();
	image.src = '';
	image.src = 'images/scorepanel.jpg';
	this.x = 480;
	this.y = 0;
	var collidable = true;
	var _loaded = false;
	
	image.onload = function() {
		_loaded = true;
	}
	
	this.Loaded = function() {
		return _loaded;
	}
	
	this.Draw = function(context) {
		context.drawImage(image,this.x,this.y);
	}
}

function Score(x,y) {
	this.value = 100;
	this.x = x;
	this.y = y;
	this.minY = y - 100;
	this.speed = 3;
	
	this.Move = function() {
		this.y -= this.speed;
	}
	
	this.Draw = function(context) {
		context.fillText(this.value,this.x,this.y);
	}
}