<?php
    session_start();
    if (!isset($_SESSION['user'])) { header('location:login.php'); }

    readfile('../versions/obs-1.0/timeplan.html');
?>