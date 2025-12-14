<?php
$host = "localhost";
$user = "sicam_user";
$pass = "sicam_pass";
$database = "basedatos";
$connection = mysqli_connect($host, $user, $pass, $database);
if (!$connection) { die('Error: '.mysqli_connect_error()); }
mysqli_set_charset($connection, "utf8mb4");
?>
