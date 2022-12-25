<?php

require_once('resources_common.php');

session_start();
if (!isset($_SESSION['eier'])) { header('location:login.php'); }



/*!
    @abstract Get names for delegates
    @returns A selectbox containing users
    @discussion
        Get user persons. Returns a selectbox containing all selectable users.
    @updated 2013-06-13
*/
function get_persons() {
    $delegates = $_SESSION['eier']->getBrukerListe();
    $sameuser  = $_SESSION['eier']->getBrukernavn() == $_SESSION['bruker']->getBrukernavn() ? true : false;
    $hidden    = count($delegates) == 0 ? "hidden='hidden'" : "";
    $selected  = $sameuser ? "selected='selected'" : "";
    $rid       = $_SESSION['eier']->getrid();

    $result  = "<select id='velgbruker' {$hidden}>";
    $result .= "<optgroup label='—— Meg selv ——'>";
    $result .= "<option val='{$rid}' {$selected}>{$_SESSION['eier']->getDisplaynavn()}</option>";
    $result .= "</optgroup>";
    $result .= "<optgroup label='—— Andre ——'>";

    foreach ($delegates as $username => $fullname) {
        $selected = !$sameuser && $_SESSION['bruker']->getBrukernavn() == $username ? "selected='selected'" : "";
        $rid      = getrid('Brukernavn', $username);
        $result .= "<option val='{$rid}' {$selected}>{$fullname}</option>";
    }

    $result .= "</optgroup></select>";
    return $result;
}



/*!
    @abstract Get user roles
    @returns A selectbox containing roles
    @discussion
        Get roles for the current user. Returns a selectbox containing all selectable roles.
    @updated 2013-06-13
*/
function get_roles() {
    $roller = $_SESSION['eier']->getDelegatRoller($_SESSION['bruker']->getBrukernavn());
    $hidden = count($roller) <= 1 ? "hidden='hidden'" : "";
    
    $result  = "<select id='velgrolle' {$hidden}>";
    foreach ($roller as $rolle => $value) {
        $selected = $_SESSION['rolle'] == $value ? "selected='selected'" : "";
        $rid = getrid('Rolle', $rolle);
        $result .= "<option val={$rid} {$selected}>{$value}</option>";
    }
    $result .= "</select>";
    return $result;
}



/*!
    @abstract Get a checkbox to enable testing
    @returns A checkbox for testing
    @discussion
        Get a checkbox to enable testing
    @updated 2013-06-13
*/
function get_testing() {
    $result = '';
    $rights = $_SESSION['bruker']->getrights();
    if (in_array('Alfatester', $rights) or in_array('Betatester', $rights)) {
        $result  = " &ensp; ";
        $result .= "<input type='checkbox' id='utvikling'>vis moduler under utvikling</input>";
    }
    return $result;
}



/*!
    @abstract Get the name of the session owner
    @returns A string containing the owner's name
    @discussion
        Get the name of the session owner
    @updated 2013-06-13
*/
function get_owner() {
    $result  = "<span id='eiernavn'>";
    $result .= $_SESSION['eier']->getDisplaynavn();
    $result .= "</span>";
    return $result;
}



function get_ownerportrait() {
    $fil = $_SESSION['eier']->getFoto();

    if ($fil == null || !is_file('../data/images/' . $fil)) { return ''; }

    $rid = getrid('Portrett', $fil);
    $result  = "<div id='eierportrett'>";
    $result .= "    <img src=resources.php?rid={$rid}>";
    $result .= "</div>";
    return $result;
}

?>