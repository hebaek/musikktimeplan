<?php

require_once('resources_common.php');

session_start();



/*!
    Log in and redirect user to index.php, after setting some sessions variables
    @abstract Log in and redirect user to index.php
    @param brukernavn The user name to log in    
    @returns Nothing
*/
function login($brukernavn) {
    $nextpage = 'location:index.php';

    try {
        $_SESSION['eier']   = new Eier($brukernavn);
        $_SESSION['bruker'] = $_SESSION['eier']->getBruker();
        $_SESSION['rolle']  = 'Lærer';
    } catch(Exception $e) {
        error_log('login(' . $brukernavn . '): Caught exception: ' . $e->getMessage());
        $nextpage = 'location:login.php?error=dbfailure';
    }

    header($nextpage);
    exit();
}

?>