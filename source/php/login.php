<?php

require_once('common.php');

session_start();



/*!
    Authenticate, authorize and log in
    @abstract Check user against database and login if authorized
    @param username The user name to log in    
    @param password The password
    @returns Nothing
*/
function login($username, $password) {
    try {
        $dbc = new DB();
        $db = $dbc->getdb();

        $db_query = $db->prepare("SELECT `PasswordHash` FROM `User` WHERE `Username` = :username");
        $db_query->execute(array(':username' => $username));
        $data = $db_query->fetch();

        $accepted = false;
        $message = 'authfailure';

        if ($data and count($data) == 2) {
            $accepted = password_verify($password, $data['PasswordHash']);
        } else {
            $message = 'badcredentials';
        }
    } catch(Exception $e) {
        error_log('login (' . $username . '): Caught exception: ' . $e->getMessage());
    }

    if ($accepted == true) {
        $_SESSION['user'] = $username;
        header('location:index.php');
    } else {
        header("location:login.php?error={$message}");
    }
}



?>