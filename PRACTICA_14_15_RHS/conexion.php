<?php
	$host = "localhost";
	$user = "root"; 
	$pass = "";
	$database = "basedatos2";
	$connection = mysqli_connect($host, $user, $pass, $database);

	if (!$connection) {
		die('Error de conexión: ' . mysqli_connect_error());
	}

	mysqli_set_charset($connection, "utf8mb4");
?>