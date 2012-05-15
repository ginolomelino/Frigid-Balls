<html>
<head>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
	<script src="js/game.js"></script>
	<link rel="stylesheet" type="text/css" src="css/styles.css"></link>
</head>
<body>
	<div id="fps">fps: 0</div>
	<canvas id="playfield" width="680px" height="640px"></canvas>
	<script type="text/javascript">
		var game = new Game();
		game.Run();

		var fpsOut = document.getElementById('fps');
		setInterval(function(){
		  fpsOut.innerHTML = "FPS: " + fps.toFixed(1);
		}, 1000);
	</script>
</body>
</html>